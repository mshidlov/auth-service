import {Injectable, UnauthorizedException} from '@nestjs/common';
import {AuthUtils} from "./auth.util";
import {UserRepository} from "./user.repository";
import {password, privilege, refreshToken, user} from "@prisma/client";
import {PermissionsDto} from "./permissions.dto";
import {PrivilegeEnum} from "./privilege.enum";
import {JwtPayloadDto} from "./jwt-payload.dto";

@Injectable()
export class AuthService {
    constructor(private userRepository: UserRepository,
                private authUtils: AuthUtils) {}

    async signIn(username: string, password: string): Promise<{
        access_token: string,
        refresh_token: string,
    }> {
        const user = await this.userRepository.findOne(username);
        if (!user) {
            throw new UnauthorizedException("Invalid login credentials provided.");
        }

        if (!await this.authUtils.isPasswordCorrect(user.password.password, user.password.salt, user.password.saltIterations, password)) {
            throw new UnauthorizedException("Invalid login credentials provided.");
        }

        const refreshToken = await this.getRefreshToken(user);
        const permissionsAndRoles = await this.userRepository.getUserRolesAndPermissions(user.id);
        const JWT:string = this.authUtils.getUserJWT({
            id: Number(user.id),
            account: Number(user.accountId),
            roles: permissionsAndRoles.roles,
            permissions: this.convertPermissionsToPermissionsDto(permissionsAndRoles.permissions)
        })
        return {
            access_token: JWT,
            refresh_token: refreshToken.token,
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

    async signOut(userId:number): Promise<refreshToken> {
        return this.userRepository.deleteRefreshToken(BigInt(userId));
    }

    private async getRefreshToken(user: user & { password:password, refreshToken:refreshToken}): Promise<refreshToken> {
        if (!user.refreshToken) {
            return this.userRepository.createRefreshToken(user.id);
        }
        return user.refreshToken;
    }

    async refresh(param: { access_token: any; refresh_token: any }): Promise<{ access_token: string; refresh_token: string; }> {
        const tokenPayLoad: JwtPayloadDto = await this.authUtils.extractJWT(param.access_token);
        return {
            access_token: this.authUtils.getUserJWT(tokenPayLoad),
            refresh_token: param.refresh_token,
        }
    }
}
