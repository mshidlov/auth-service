import {Injectable} from "@nestjs/common";
import {PrismaService} from "../data-access";
import {
    account,
    password,
    permission,
    refresh_token,
    role,
    role_permission,
    user,
    user_email,
    user_role,
    PrismaClient
} from "@prisma/client";
import * as runtime from '@prisma/client/runtime/library';
import { randomBytes } from 'crypto';

type transaction = Omit<PrismaClient, runtime.ITXClientDenyList>;

@Injectable()
export class AuthenticationRepository{
    constructor(private prismaService: PrismaService) {
    }

    async createUserAccount(username: string, salt: string, hash: string, iterations: number, pepperVersion: string, email?: string): Promise<user & {
        account: account,
        user_email: user_email[];
        user_role: user_role[];
    }> {
        return this.prismaService.$transaction(async (connection) => {
            const user = await this.createUser(
                connection,
                username,
                salt,
                hash,
                iterations,
                pepperVersion,
            );
            const permissions = await this.getPermissions(connection);
            const user_role = await this.createAccountOwnerRole(
                connection,
                user.id,
                user.accountId,
                permissions,
            );

            return {
                ...user,
                user_role: [user_role],
            }
        })
    }

    private async getPermissions(prisma: transaction): Promise<permission[]> {
        return prisma.permission.findMany();
    }

    private async createAccountOwnerRole(
        prisma: transaction,
        userId: bigint,
        accountId: bigint,
        permissions: permission[],
    ): Promise<user_role> {
        return prisma.user_role.create({
            data: {
                role: {
                    create: {
                        name: 'Account Owner',
                        account: {
                            connect: {
                                id: accountId,
                            },
                        },
                        rolePermissions: {
                            create: permissions.map((permission) => ({permission: {connect: {id: permission.id}}})),
                        },
                    }
                },
                user: {
                    connect: {
                        id: userId,
                    },
                }
            },
        });
    }




    private createUser(
        prisma: transaction,
        username: string,
        salt: string,
        password: string,
        iterations: number,
        pepperVersion: string,
        email?: string,
    ): Promise<
        user & {
        account: account;
        user_email: user_email[];
    }
    > {
        return prisma.user.create({
            data: {
                username: username,
                account: {
                    create: {},
                },
                refreshToken: {
                    create: {
                        token: this.generateRefreshToken(),
                    },
                },
                password: {
                    create: {
                        salt,
                        password,
                        iterations,
                        pepperVersion: pepperVersion.toString(),
                    },
                },
            },
            include: {
                account: true,
                user_email: true,
            },
        });
    }

    getUserByUsername(username: string): Promise<user & { password: password }> {
        return this.prismaService.user.findUnique({
            where: { username },
            include: {
                password: true,
            },
        });
    }

    async deleteRefreshToken(id: number): Promise<refresh_token> {
        return this.prismaService.refresh_token.delete({
            where: { id },
        });
    }

    async getOrCreateUserRefreshToken(id: bigint): Promise<refresh_token> {
        return this.prismaService.refresh_token.upsert({
            where: { id },
            update: {},
            create: {
                token: this.generateRefreshToken(),
                user: {
                    connect: { id },
                }
            },
        });
    }

    private generateRefreshToken() {
        return randomBytes(32).toString('hex');
    }

    async getUserRolePermissions(id: bigint): Promise<(role_permission & {role: role, permission:permission})[]> {
        return this.prismaService.role_permission.findMany({
            where: {
                role: {
                    userRole: {
                        some: {
                            userId: id,
                        },
                    },
                },
            },
            include: {
                permission: true,
                role: true,
            }
        });
    }
}
