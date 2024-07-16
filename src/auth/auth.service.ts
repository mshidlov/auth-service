import {
  ForbiddenException,
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
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  private configurations: {
    emails: {
      verification_required: boolean;
    };
  } = {
    emails: {
      verification_required: true,
    },
  };
  constructor(
    private userRepository: UserRepository,
    private authUtils: AuthUtils,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signIn(username: string, password: string): Promise<LoginResponseDto> {
    const user = await this.userRepository.findOne(username);
    if (this.configurations.emails.verification_required && !user.isVerified) {
      throw new ForbiddenException('Please validate your email');
    }

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

    const refreshToken = await this.getRefreshToken(user);
    const permissionsAndRoles =
      await this.userRepository.getUserRolesAndPermissions(user.id);
    const JWT: string = this.getUserJWT({
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

  async signOut(userId: number, access_token: string): Promise<void> {
    const JWT = await this.extractJWT(access_token);
    if (
      !JWT ||
      BigInt(JWT.id) !== BigInt(userId) ||
      JWT['exp'] < Date.now() / 1000
    ) {
      throw new UnauthorizedException();
    }
    await this.userRepository.deleteRefreshToken(BigInt(userId));
    return;
  }

  private async getRefreshToken(
    user: user & { password: password; refreshToken: refresh_token },
  ): Promise<refresh_token> {
    if (!user.refreshToken) {
      return this.userRepository.createRefreshToken(user.id);
    }
    return user.refreshToken;
  }

  async refresh(param: {
    access_token: string;
    refresh_token: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const tokenPayLoad: JwtPayloadDto = await this.extractJWT(
      param.access_token,
    );
    const refreshToken = await this.userRepository.getRefreshToken(
      tokenPayLoad.id,
      param.refresh_token,
    );
    if (
      !refreshToken ||
      refreshToken.userId !== BigInt(tokenPayLoad.id) ||
        (this.configurations.emails.verification_required && refreshToken.user?.isVerified) ||
      refreshToken.user?.isDeleted ||
      refreshToken.user?.isBlocked
    ) {
      throw new UnauthorizedException('Invalid refresh token provided.');
    }

    return {
      access_token: this.getUserJWT({
        id: tokenPayLoad.id,
        account: tokenPayLoad.account,
        roles: tokenPayLoad.roles,
        permissions: tokenPayLoad.permissions,
      }),
      refresh_token: param.refresh_token,
    };
  }

  async signUp(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserDto;
  }> {
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
      access_token: this.getUserJWT({
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
  async addEmail(
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
    const payload = jwt.verify(token, '');
    const emailId = BigInt(payload.substring);
    const user_email = await this.userRepository.verifyEmail(emailId);
    return user_email?.isVerified || false;
  }

  private async sendVerificationEmail(
    emailId: bigint,
    email: string,
    username: string,
  ) {
    const JWT: string = jwt.sign(emailId.toString(), '', {
      expiresIn: 60 * 60 * 24,
    });
    const validationLink = `http://localhost:3000/auth/verify/email/${JWT}`;
    return this.emailService.sendVerificationEmail(
      email,
      username,
      validationLink,
    );
  }

  getUserJWT(jwtPayloadDto: JwtPayloadDto): string {
    return this.jwtService.sign(jwtPayloadDto);
  }

  async extractJWT(access_token: string): Promise<JwtPayloadDto> {
    return this.jwtService.decode(access_token);
  }
}
