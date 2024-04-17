import {Injectable} from "@nestjs/common";
import {PrismaService} from "./prisma.service";
import {refreshToken, password, user, privilege, account, permission, userRole, role} from "@prisma/client";

@Injectable()
export class UserRepository {
    constructor(private prisma: PrismaService) {}

    async findOne(email: string): Promise<user & { password:password, refreshToken:refreshToken, account:account} | undefined> {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
            include: {
                password: true,
                refreshToken: true,
                account: true,
            }
        });
    }

    async getUserRolesAndPermissions(userId: bigint): Promise<{ roles: string[], permissions: { resource: string, privilege: privilege }[]}> {
        const res = await this.prisma.user.findUnique({
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
                                            }
                                        },
                                    },
                                },
                            },
                        },
                    }
                }
            }
        })

        return {
            roles: res.userRole.map(it => it.role.name),
            permissions: res.userRole.reduce((acc, it) => {
                return acc.concat(it.role.rolePermissions.map(it => it.permission));
            }, [])
        }
    }


    async createRefreshToken(userId: bigint): Promise<refreshToken> {
        return this.prisma.refreshToken.create({
            data: {
                userId,
                token: Math.random().toString(36).substring(7),
            },
        });
    }
    async getOrCreateRefreshToken(userId: bigint): Promise<refreshToken> {
        return this.prisma.refreshToken.upsert({
            where: {
                userId,
            },
            update: {
                updatedAt: new Date(),
            },
            create: {
                userId,
                token: Math.random().toString(36).substring(7),
            },
        });
    }

    deleteRefreshToken(userId: bigint): Promise<refreshToken> {
        return this.prisma.refreshToken.delete({
            where: {
                userId,
            },
        })
    }


    createUser(email: string, salt: string, hashedPassword: string,
               iterations: number,pepperVersion:string): Promise<user & { account:account, refreshToken:refreshToken, password:password}> {
        return this.prisma.user.create({
            data: {
                email,
                account: {
                    create: {
                    }
                },
                refreshToken: {
                    create: {
                        token: Math.random().toString(36).substring(7),
                    }
                },
            },
            include: {
                account: true,
                refreshToken: true,
                password: true,
            }
        });
    }

    async updateUserPassword(user:user, password: password): Promise<password> {
        await this.prisma.password.updateMany({
            where: {
                userId: user.id
            },
            data: {
                active: false
            }
        })
        return this.prisma.password.update({
            where: {
                id: password.id,
            },
            data: {
                ...password,
                userId: user.id,
                active: true
            }
        });


    }

    async createAccountOwnerRole(id: bigint, accountId: bigint, permissions: permission[]): Promise<userRole & { role: role}> {
        return this.prisma.userRole.create({
            data: {
                user: {
                    connect:{
                        id
                    }
                },
                role: {
                    create: {
                        name: 'Account Owner',
                        accountId: accountId,
                        rolePermissions: {
                            create: permissions.map(it => ({
                                permission: {
                                    connect: {
                                        id: it.id
                                    }
                                }
                            }))
                        }
                    }
                }
            },
            include: {
                role: true
            }
        })

    }

    getPermissions(): Promise<permission[]> {
        return this.prisma.permission.findMany();
    }
}
