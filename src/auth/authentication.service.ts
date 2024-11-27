import {Injectable, Logger, UnauthorizedException} from "@nestjs/common";
import {JwtPayloadDto, LoginRequest, LoginResponse, PermissionsDto, PrivilegeEnum} from "./entities";
import {AuthUtils} from "./auth.util";
import {TokenService} from "./token.service";
import {AuthenticationRepository} from "./authentication.repository";
import {permission, refresh_token, role_permission} from "@prisma/client";

@Injectable()
export class AuthenticationService{

    private readonly logger = new Logger(AuthenticationService.name);

    constructor(private authUtils: AuthUtils,
                private tokenService: TokenService,
                private authenticationRepository:AuthenticationRepository) {
    }

    async login(loginRequest: LoginRequest):Promise<LoginResponse> {
        const user = await this.authenticationRepository.getUserByUsername(loginRequest.username);
        if(!user ||
            user.isBlocked ||
            user.isDeleted ||
            await this.authUtils.isPasswordCorrect(
                user.password.password,
                user.password.salt,
                user.password.iterations,
                loginRequest.password)){
            throw new UnauthorizedException('Invalid username or password');
        }

        const refreshToken = await this.authenticationRepository.getOrCreateUserRefreshToken(user.id);
        const rolePermissions = await this.authenticationRepository.getUserRolePermissions(user.id);
        const roles = rolePermissions.reduce((acc, rolePermission) => {
            if (!acc.includes(rolePermission.role.name)) {
                acc.push(rolePermission.role.name);
            }
            return acc;
        },[] as string[]);

        const token = await this.tokenService.sign(new JwtPayloadDto({
            account: Number(user.accountId),
            id: Number(user.id),
            permissions: this.groupPermissionsByResource(rolePermissions),
            roles,
        }))

        return {
            access_token: token,
            refresh_token: refreshToken.token,
        }
    }

    private groupPermissionsByResource(permissions: (role_permission & {permission:permission})[]): PermissionsDto[] {
        return permissions.reduce((acc, rolePermission) => {
            const index = acc.findIndex((p) => p.r === rolePermission.permission.resource);
            if(index > -1) {
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
    async signup(password: string, username: string, email?: string) {
        const { salt, hash, iterations, pepperVersion } =
            await this.authUtils.hashPassword(password);

        const user =
        await this.authenticationRepository.createUserAccount(
            username,
            salt,
            hash,
            iterations,
            pepperVersion,
            email
        );

        this.logger.log(`User ${username} created successfully with id ${user.id} and account id ${user.accountId}`);
    }

    async logout(jwtPayload: JwtPayloadDto, userId: number): Promise<refresh_token> {
        if (jwtPayload.id !== userId) {
            throw new UnauthorizedException('User is not authorized to perform this action');
        }

        return await this.authenticationRepository.deleteRefreshToken(jwtPayload.id);
    }
}