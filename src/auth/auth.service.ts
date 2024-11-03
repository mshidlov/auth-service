import {
  ForbiddenException, Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUtils } from './auth.util';
import { UserRepository } from './user.repository';
import {
  password,
  privilege,
  refresh_token,
  user,
  user_email,
} from '@prisma/client';
import { PermissionsDto } from './permissions.dto';
import { PrivilegeEnum } from './privilege.enum';
import { JwtPayloadDto } from './jwt-payload.dto';
import { LoginResponseDto, UserDto } from './entities';
import { LoginDto } from './entities';

import { MailingService } from './mailing.service';
import {TokenService} from "./token.service";
import {serviceTokensConstants} from "./constants";

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  private configurations: {
    emails: {
      verificationTokenTTL: number
      verificationIsRequired: boolean
      verificationLocation: string
    };
  } = {
    emails: {
      verificationTokenTTL: 60 * 60 * 24,
      verificationIsRequired: false,
      verificationLocation: "http://localhost:3000"
    },
  };
  constructor(
    private userRepository: UserRepository,
    private authUtils: AuthUtils,
    private emailService: MailingService,
    @Inject(serviceTokensConstants.JWT_SERVICE_TOKEN) private jwtService:TokenService,
    @Inject(serviceTokensConstants.EMAILS_JWT_SERVICE_TOKEN) private emailTokenService:TokenService,
  ) {}

  async signIn(username: string, password: string): Promise<LoginResponseDto> {
    const user = await this.userRepository.findOne(username);
    if (
      !user ||
      user.isBlocked ||
      user.isDeleted ||
      !(await this.authUtils.isPasswordCorrect(
        user.password.password,
        user.password.salt,
        user.password.iterations,
        password,
      ))
    ) {
      throw new UnauthorizedException('Invalid login credentials provided.');
    }

    if (this.configurations.emails.verificationIsRequired && !user.isVerified) {
      throw new ForbiddenException('Please validate your email');
    }

    const refreshToken = await this.getRefreshToken(user);
    const permissionsAndRoles =
      await this.userRepository.getUserRolesAndPermissions(user.id);
    const JWT: string = await this.jwtService.sign({
      id: Number(user.id),
      account: Number(user.accountId),
      roles: permissionsAndRoles.roles,
      permissions: this.convertPermissionsToPermissionsDto(
        permissionsAndRoles.permissions,
      ),
    });
    return {
      access_token: JWT,
      refresh_token: refreshToken.token,
      user: {
        id: Number(user.id),
        account: {
          id: Number(user.accountId),
          name: user.account.name,
        },
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: permissionsAndRoles.roles,
      },
    };
  }

  private convertPermissionsToPermissionsDto(
    permissions: { resource: string; privilege: privilege }[],
  ): PermissionsDto[] {
    return Object.entries(
      permissions.reduce(
        (acc, current) => {
          (acc[current.resource] = acc[current.resource] || []).push(current);
          return acc;
        },
        {} as Record<string, { resource: string; privilege: privilege }[]>,
      ),
    ).map(([key, value]) => {
      return {
        r: key,
        p: value.map((it) => this.convertToPrivilegeEnum(it.privilege)),
      };
    });
  }

  private convertToPrivilegeEnum(
    privilege: privilege,
  ): PrivilegeEnum | undefined {
    return PrivilegeEnum[privilege.toString() as keyof typeof PrivilegeEnum];
  }

  async signOut(userId: number): Promise<void> {
    await this.userRepository.deleteRefreshToken(BigInt(userId));
  }

  private async getRefreshToken(
    user: user & { password: password; refreshToken: refresh_token },
  ): Promise<refresh_token> {
    if (!user.refreshToken) {
      return this.userRepository.createRefreshToken(user.id);
    }
    return user.refreshToken;
  }

    extractJwtTokenFromHeader(authorization: string): string {
      if (!authorization) {
        throw new UnauthorizedException('Authorization header is missing');
      }
      const parts = authorization.split(' ');
      if (parts.length !== 2) {
        throw new UnauthorizedException('Invalid authorization header');
      }
      if (parts[0].toLowerCase() !== 'bearer') {
        throw new UnauthorizedException('Invalid authorization header');
      }
      return parts[1];
    }

  async refresh(param: {
    cookies?: {
      access_token: string;
      refresh_token: string;
    },
    headers?: {
      access_token: string;
      refresh_token: string;
    }
  }): Promise<{ access_token: string; refresh_token: string }> {
    const access_token = param?.cookies?.access_token || this.extractJwtTokenFromHeader(param?.headers?.access_token)
    const refresh_token = param?.cookies?.refresh_token || param?.headers?.refresh_token
    const tokenPayLoad: JwtPayloadDto = await this.tokenPayload(access_token);
    const refreshToken = await this.userRepository.getRefreshToken(
      tokenPayLoad.id,
      refresh_token,
    );
    if (
      !refreshToken ||
      refreshToken.userId !== BigInt(tokenPayLoad.id) ||
        (this.configurations.emails.verificationIsRequired && refreshToken.user?.isVerified) ||
      refreshToken.user?.isDeleted ||
      refreshToken.user?.isBlocked
    ) {
      throw new UnauthorizedException('Invalid refresh token provided.');
    }

    return {
      access_token: await this.jwtService.sign({
        id: tokenPayLoad.id,
        account: tokenPayLoad.account,
        roles: tokenPayLoad.roles,
        permissions: tokenPayLoad.permissions,
      }),
      refresh_token: refresh_token,
    };
  }

  async signUp(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserDto;
  }> {

    if (await this.userRepository.findOne(loginDto.username)) {
      throw new ForbiddenException('Username is already taken.');
    }

    this.logger.log(`signup user, username=${loginDto.username}`);

    const { salt, hash, iterations, pepperVersion } =
      await this.authUtils.hashPassword(loginDto.password);

    const { user, userRole, permissions } =
      await this.userRepository.createAccount(
        loginDto.username,
        salt,
        hash,
        iterations,
        pepperVersion,
      );

    this.logger.log(`Created user with id ${user.id}`);
    return {
      access_token: await this.jwtService.sign({
        id: Number(user.id),
        account: Number(user.accountId),
        roles: [userRole.role.name],
        permissions: this.convertPermissionsToPermissionsDto(permissions),
      }),
      refresh_token: user.refreshToken.token,
      user: {
        id: Number(user.id),
        account: {
          id: Number(user.accountId),
          name: user.account.name,
        },
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [userRole.role.name],
      },
    };
  }
  async updateUserEmail(
    userId: number,
    email: string,
  ): Promise<Omit<user_email, 'userId'>> {
    const user_email = await this.userRepository.addEmail(
      BigInt(userId),
      email,
    );
    await this.sendVerificationEmail(
      user_email.id,
      email,
      user_email.user.username,
    );
    return {
      id: user_email.id,
      email: user_email.email,
      isPrimary: user_email.isPrimary,
      isVerified: user_email.isVerified,
      createdAt: user_email.createdAt,
      updatedAt: user_email.updatedAt,
    };
  }

  async verifyEmail(token: string): Promise<boolean> {
    const payload = await this.emailTokenService.verify(token)
    const emailId = BigInt(payload.payload.substring);
    const user_email = await this.userRepository.verifyEmail(emailId);
    return user_email?.isVerified || false;
  }

  private async sendVerificationEmail(
    emailId: bigint,
    email: string,
    username: string,
  ) {
    const JWT = await this.emailTokenService.sign(emailId.toString());
    const validationLink = `${this.configurations.emails.verificationLocation}/auth/verify/email/${JWT}`;
    return this.emailService.sendVerificationEmail(
      email,
      username,
      validationLink,
    );
  }

  private async tokenPayload(jwt:string): Promise<JwtPayloadDto> {
    const decoded = await this.jwtService.decode(jwt)
    if (!decoded || !decoded.payload) {
      throw new UnauthorizedException('Invalid token provided.');
    }
    return JSON.parse(JSON.stringify(decoded.payload))
  }
}
