import {ForbiddenException, Injectable, Logger, UnauthorizedException} from "@nestjs/common";
import {JwtPayloadDto, LoginRequest, LoginResponse, PermissionsDto, PrivilegeEnum, SsoPayloadDto} from "./entities";
import {AuthUtils} from "./auth.util";
import {TokenService} from "./token.service";
import {AuthenticationRepository} from "./authentication.repository";
import {
    permission,
    refresh_token,
    role_permission,
    privilege,
    user,
    account,
    user_role, role
} from "@prisma/client";

@Injectable()
export class AuthenticationService {

    private readonly logger = new Logger(AuthenticationService.name);
    private readonly configurations: {
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

    constructor(private authUtils: AuthUtils,
                private tokenService: TokenService,
                private authenticationRepository: AuthenticationRepository) {
    }

    async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        const user = await this.authenticationRepository.getUserByUsername(loginRequest.username);
        if (!user ||
            user.isBlocked ||
            user.isDeleted ||
            !(await this.authUtils.isPasswordCorrect(
                user.password.password,
                user.password.salt,
                user.password.iterations,
                loginRequest.password))) {
            throw new UnauthorizedException('Invalid login credentials provided.');
        }

        if (this.configurations.emails.verificationIsRequired && !user.isVerified) {
            throw new ForbiddenException('Please validate your email');
        }

        const refreshToken = await this.authenticationRepository.getOrCreateUserRefreshToken(user.id);
        const permissionsAndRoles =
            await this.authenticationRepository.getUserRolesAndPermissions(user.id);
        const JWT: string = await this.tokenService.sign({
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
                    name: ''
                },
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: permissionsAndRoles.roles,
            },
        };
    }

    private groupPermissionsByResource(permissions: (role_permission & {
        permission: permission
    })[]): PermissionsDto[] {
        return permissions.reduce((acc, rolePermission) => {
            const index = acc.findIndex((p) => p.r === rolePermission.permission.resource);
            if (index > -1) {
                acc[index].p.push(PrivilegeEnum[rolePermission.permission.privilege]);
            } else {
                acc.push({
                    r: rolePermission.permission.resource,
                    p: [PrivilegeEnum[rolePermission.permission.privilege]],
                });
            }
            return acc
        }, [] as PermissionsDto[]);
    }

    async signup(password: string, username: string, email?: string): Promise<LoginResponse> {
        if (await this.authenticationRepository.getUserByUsername(username)) {
            throw new UnauthorizedException('Username is already taken.');
        }

        this.logger.log(`signup user, username=${username}`);

        const {salt, hash, iterations, pepperVersion} =
            await this.authUtils.hashPassword(password);

        const {user, userRole, permissions} =
            await this.authenticationRepository.createUserAccount(
                username,
                salt,
                hash,
                iterations,
                pepperVersion,
                email
            );

        this.logger.log(`Created user with id ${user.id}`);
        return this.loginNewUser(user, [userRole], permissions);
    }

    async logout(access_token:string, refresh_token:string, userId: number): Promise<refresh_token> {
        const jwtPayload = await this.tokenPayload(access_token);
        if (jwtPayload.id !== userId) {
            throw new UnauthorizedException('Invalid token provided.');
        }
        const token = await this.authenticationRepository.deleteRefreshToken(jwtPayload.id,refresh_token);
        if(token){
            this.logger.log(`User ${jwtPayload.id} logout successfully user ${userId}`);
        }
        return token
    }

    private async tokenPayload(jwt: string): Promise<JwtPayloadDto> {
        const decoded = await this.tokenService.decode(jwt)
        if (!decoded || !decoded.payload) {
            throw new UnauthorizedException('Invalid token provided.');
        }
        return JSON.parse(JSON.stringify(decoded.payload))
    }

    private extractJwtTokenFromHeader(authorization: string): string {
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
        const refreshToken = await this.authenticationRepository.getRefreshToken(
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

        // TODO: Security issue, sign new JWT with database values and not the ones from the old token
        return {
            access_token: await this.tokenService.sign({
                id: tokenPayLoad.id,
                account: tokenPayLoad.account,
                roles: tokenPayLoad.roles,
                permissions: tokenPayLoad.permissions,
            }),
            refresh_token: refresh_token,
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


    private async signupSso(provider: 'GOOGLE', profile: SsoPayloadDto) {
        await this.ensureEmailIsUnique(profile.email);

        const {user, userRole, permissions} = await this.createSsoUserAccount(provider, profile);

        return this.loginNewUser(user, [userRole], permissions);
    }

    private async ensureEmailIsUnique(email: string) {
        if (await this.authenticationRepository.isEmailExist(email)) {
            throw new UnauthorizedException('Email is already taken.');
        }
    }

    private async createSsoUserAccount(provider: 'GOOGLE', profile: SsoPayloadDto): Promise<{
        user: user & {
            account: account;
            refreshToken: refresh_token;
        };
        permissions: permission[];
        userRole: user_role & { role: role };
    }> {
        return this.authenticationRepository.createSsoUserAccount(
            provider,
            profile.id,
            profile.email,
            profile.username,
            profile.firstName,
            profile.lastName,
        );
    }

    private async signToken(id: number, account: number, roles: string[], permissions: { resource: string; privilege: privilege }[]):Promise<string>{
        const permissionsDto = this.convertPermissionsToPermissionsDto(permissions);
        return await this.tokenService.sign({
            id,
            account,
            roles,
            permissions: permissionsDto,
        })
    }

    private async loginSsoUser(ssoUser: user & { refreshToken: refresh_token }): Promise<LoginResponse> {
        const { id, accountId, username, firstName, lastName, refreshToken } = ssoUser;
        const permissionsAndRoles = await this.authenticationRepository.getUserRolesAndPermissions(id);
        const { roles, permissions } = permissionsAndRoles;

        return {
            access_token: await this.signToken(Number(id), Number(accountId), roles, permissions),
            refresh_token: refreshToken.token,
            user: {
                id: Number(id),
                account: {
                    id: Number(accountId),
                    name: '',
                },
                username,
                firstName,
                lastName,
                roles,
            },
        };
    }

    private async loginNewUser(
        user: user & { refreshToken: refresh_token, account: account },
        roles: (user_role & { role: role })[],
        permissions: permission[]
    ): Promise<LoginResponse> {
        const mappedRoles = roles.map((it) => it.role.name);
        return {
            access_token: await this.signToken(Number(user.id), Number(user.accountId), mappedRoles, permissions),
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
                roles: mappedRoles,
            },
        };
    }

    async sso(provider: 'GOOGLE', profile: SsoPayloadDto): Promise<LoginResponse> {
        const user = await this.authenticationRepository.getUserByProviderId(provider,profile.id)
        if(user){
            this.logger.log(`SSO login, user ${user.id}, ${provider} id ${profile.id}`)
            return this.loginSsoUser(user)
        }
        this.logger.log(`SSO signup, ${provider} id ${profile.id}`)
        return this.signupSso(provider,profile)

    }
}