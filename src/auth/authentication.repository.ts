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
    user_role,
    PrismaClient, privilege, single_sign_on_origin
} from "@prisma/client";
import * as runtime from '@prisma/client/runtime/library';
import { randomBytes } from 'crypto';

type transaction = Omit<PrismaClient, runtime.ITXClientDenyList>;

@Injectable()
export class AuthenticationRepository {
    constructor(private prismaService: PrismaService) {
    }

    async createUserAccount(username: string, salt: string, hash: string, iterations: number, pepperVersion: string, email?: string): Promise<{
        user: user & {
            account: account;
            refreshToken: refresh_token;
        };
        permissions: permission[];
        userRole: user_role & { role: role };
    }> {
        return this.prismaService.$transaction(async (prisma) => {
            const user = await this.createUser(
                prisma,
                username,
                salt,
                hash,
                iterations,
                pepperVersion,
            );
            const permissions = await this.getPermissions(prisma);
            const userRole = await this.createAccountOwnerRole(
                prisma,
                user.id,
                user.accountId,
                permissions,
            );
            return {
                user,
                permissions,
                userRole,
            };
        });
    }

    private async getPermissions(prisma: transaction): Promise<permission[]> {
        return prisma.permission.findMany();
    }

    private async createAccountOwnerRole(
        prisma: transaction,
        userId: bigint,
        accountId: bigint,
        permissions: permission[],
    ): Promise<user_role & { role: role}> {
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
            include: {
                role: true,
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
        refreshToken: refresh_token
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
                refreshToken: true,
            },
        });
    }

    getUserByUsername(username: string): Promise<user & { password: password }> {
        return this.prismaService.user.findUnique({
            where: {username},
            include: {
                password: true,
            },
        });
    }

    async deleteRefreshToken(id: number): Promise<refresh_token> {
        return this.prismaService.refresh_token.delete({
            where: {id},
        });
    }

    async getOrCreateUserRefreshToken(id: bigint): Promise<refresh_token> {
        return this.prismaService.refresh_token.upsert({
            where: {userId: id},
            update: {},
            create: {
                token: this.generateRefreshToken(),
                user: {
                    connect: {id},
                }
            },
        });
    }

    private generateRefreshToken() {
        return randomBytes(32).toString('hex');
    }

    async getUserRolePermissions(id: bigint): Promise<(role_permission & { role: role, permission: permission })[]> {
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

    async getUserRolesAndPermissions(userId: bigint): Promise<{
        roles: string[];
        permissions: { resource: string; privilege: privilege }[];
    }> {
        const res = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                userRole: {
                    select: {
                        role: {
                            select: {
                                name: true,
                                rolePermissions: {
                                    select: {
                                        permission: {
                                            select: {
                                                resource: true,
                                                privilege: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return {
            roles: res.userRole.map((it) => it.role.name),
            permissions: res.userRole.reduce((acc, it) => {
                return acc.concat(it.role.rolePermissions.map((it) => it.permission));
            }, []),
        };

    }

    getRefreshToken(
        userId: number,
        token: string,
    ): Promise<(refresh_token & { user: user }) | null> {
        return this.prismaService.refresh_token.findFirst({
            where: {
                userId: BigInt(userId),
                token,
            },
            include: {
                user: true,
            },
        });
    }

    async getUserByProviderId(single_sign_on_origin:single_sign_on_origin, id: string): Promise<user & {
        account: account;
        refreshToken: refresh_token
    }> {
        return this.prismaService.user.findFirst({
            where: {
                third_party_auth: {
                    some: {
                        originId: id,
                        origin: single_sign_on_origin,
                    }
                }
            },
            include: {
                account: true,
                refreshToken: true,
            },
        })
    }

    async createSsoUserAccount(single_sign_on_origin: single_sign_on_origin, id: string, email: string, username: string, firstName: string, lastName: string):Promise<{
        user: user & {
            account: account;
            refreshToken: refresh_token;
        };
        permissions: permission[];
        userRole: user_role & { role: role };
    }> {
        return this.prismaService.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    username: username,
                    firstName,
                    lastName,
                    isVerified: true,
                    account: {
                        create: {},
                    },
                    refreshToken: {
                        create: {
                            token: this.generateRefreshToken(),
                        },
                    },
                    user_email: {
                        create: {
                            isVerified: true,
                            isPrimary: true,
                            email,
                        },
                    },
                    third_party_auth: {
                        create: {
                            origin: single_sign_on_origin,
                            originId: id,
                        },
                    },
                },
                include: {
                    account: true,
                    refreshToken: true,
                    third_party_auth: true,
                },
            });
            const permissions = await this.getPermissions(prisma);
            const userRole = await this.createAccountOwnerRole(
                prisma,
                user.id,
                user.accountId,
                permissions,
            );
            return {
                user,
                permissions,
                userRole,
            };
        });
    }

    async isEmailExist(email: string): Promise<boolean> {
        return !!(await this.prismaService.user_email.findUnique({
            select: {
                id: true,
            },
            where: {
                email,
            },
        }))
    }
}
