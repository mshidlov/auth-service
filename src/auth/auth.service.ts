import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {AuthUtils} from "./auth.util";
import {UserRepository} from "./user.repository";
import {password, privilege, refresh_token, user} from "@prisma/client";
import {PermissionsDto} from "./permissions.dto";
import {PrivilegeEnum} from "./privilege.enum";
import {JwtPayloadDto} from "./jwt-payload.dto";
import {LoginResponseDto} from "./entities";
import {LoginDto} from "./entities";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class AuthService {

    private logger = new Logger(AuthService.name);
    constructor(private userRepository: UserRepository,
                private authUtils: AuthUtils,
                private jwtService: JwtService) {}

    async signIn(username: string, password: string): Promise<LoginResponseDto> {
        const user = await this.userRepository.findOne(username);
        if (!user) {
            throw new UnauthorizedException("Invalid login credentials provided.");
        }

        if (!await this.authUtils.isPasswordCorrect(user.password.password, user.password.salt, user.password.iterations, password)) {
            throw new UnauthorizedException("Invalid login credentials provided.");
        }

        const refreshToken = await this.getRefreshToken(user);
        const permissionsAndRoles = await this.userRepository.getUserRolesAndPermissions(user.id);
        const JWT: string = this.getUserJWT({
            id: Number(user.id),
            account: Number(user.accountId),
            roles: permissionsAndRoles.roles,
            permissions: this.convertPermissionsToPermissionsDto(permissionsAndRoles.permissions)
        })
        return {
            access_token: JWT,
            refresh_token: refreshToken.token,
            user: {
                id: Number(user.id),
                account: {
                    id: Number(user.accountId),
                    name: user.account.name
                },
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: permissionsAndRoles.roles,
            }
        };
    }

    private convertPermissionsToPermissionsDto(permissions:{ resource: string, privilege: privilege }[]): PermissionsDto[] {
        return Object.entries(permissions.reduce((acc, current) => {
            (acc[current.resource] = acc[current.resource] || []).push(current);
            return acc;
        }, {} as Record<string, { resource: string, privilege: privilege }[]>)).map(([key, value]) => {
            return {
                r: key,
                p: value.map(it => this.convertToPrivilegeEnum(it.privilege))
            }
        })
    }

    private convertToPrivilegeEnum(privilege: privilege): PrivilegeEnum | undefined {
        return PrivilegeEnum[privilege.toString() as keyof typeof PrivilegeEnum];
    }

    async signOut(userId:number,access_token:string): Promise<void> {
        const JWT = await this.extractJWT(access_token)
        if(!JWT || BigInt(JWT.id) !== BigInt(userId) || JWT['exp'] < Date.now() / 1000) {
            throw new UnauthorizedException();
        }
        await this.userRepository.deleteRefreshToken(BigInt(userId));
        return
    }

    private async getRefreshToken(user: user & { password:password, refreshToken:refresh_token}): Promise<refresh_token> {
        if (!user.refreshToken) {
            return this.userRepository.createRefreshToken(user.id);
        }
        return user.refreshToken;
    }

    async refresh(param: { access_token: any; refresh_token: any }): Promise<{ access_token: string; refresh_token: string; }> {
        const tokenPayLoad: JwtPayloadDto = await this.extractJWT(param.access_token);
        const refreshToken = await this.userRepository.getRefreshToken(tokenPayLoad.id,param.refresh_token);
        if(!refreshToken || refreshToken.userId !== BigInt(tokenPayLoad.id)) {
            throw new UnauthorizedException("Invalid refresh token provided.");
        }
        return {
            access_token: this.getUserJWT({
                id: tokenPayLoad.id,
                account: tokenPayLoad.account,
                roles: tokenPayLoad.roles,
                permissions: tokenPayLoad.permissions
            }),
            refresh_token: param.refresh_token,
        }
    }

    async signUp(loginDto: LoginDto): Promise<LoginResponseDto> {
        const {salt, hash, iterations, pepperVersion} = await this.authUtils.hashPassword(loginDto.password)
        const {user,userRole,permissions} = await  this.userRepository.transaction(async (connection) => {
            const user = await this.userRepository.createUser(connection,loginDto.email,salt, hash, iterations, pepperVersion);
            const permissions = await this.userRepository.getPermissions(connection)
            const userRole = await this.userRepository.createAccountOwnerRole(connection,user.id, user.accountId, permissions);
            return {
                user,
                permissions,
                userRole
            }
        })

        this.logger.log(`Created user with id ${user.id}`);
        return {
            access_token: this.getUserJWT({
                id: Number(user.id),
                account: Number(user.accountId),
                roles: [userRole.role.name],
                permissions: this.convertPermissionsToPermissionsDto(permissions)
            }),
            refresh_token: user.refreshToken.token,
            user: {
                id: Number(user.id),
                account: {
                    id: Number(user.accountId),
                    name: user.account.name
                },
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [userRole.role.name],
            }
        };
    }
    getUserJWT(jwtPayloadDto: JwtPayloadDto): string {
        return this.jwtService.sign(jwtPayloadDto);
    }

    async extractJWT(access_token: string): Promise<JwtPayloadDto> {
        return this.jwtService.decode(access_token)
    }
}
