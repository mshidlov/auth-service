import {Injectable, Logger} from "@nestjs/common";
import {PrismaService} from "./prisma.service";
import {
    password,
    user,
    privilege,
    account,
    permission,
    user_role,
    role,
    PrismaClient, refresh_token
} from "@prisma/client";
import * as runtime from "@prisma/client/runtime/library";

type transaction = Omit<PrismaClient, runtime.ITXClientDenyList>
@Injectable()
export class UserRepository {

    private readonly logger = new Logger(UserRepository.name);
    constructor(private prisma: PrismaService) {}

    async findOne(email: string): Promise<user & { password:password, refreshToken:refresh_token, account:account} | undefined> {
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


    async createRefreshToken(userId: bigint): Promise<refresh_token> {
        return this.prisma.refresh_token.create({
            data: {
                userId,
                token:this.generateRefreshToken()
            },
        });
    }

    private generateRefreshToken(): string {
        return Math.random().toString(36)
    }
    async getOrCreateRefreshToken(userId: bigint): Promise<refresh_token> {
        return this.prisma.refresh_token.upsert({
            where: {
                userId,
            },
            update: {
                updatedAt: new Date(),
            },
            create: {
                userId,
                token: this.generateRefreshToken(),
            },
        });
    }

    deleteRefreshToken(userId: bigint): Promise<refresh_token> {
        return this.prisma.refresh_token.delete({
            where: {
                userId,
            },
        })
    }


    createUser(prisma:transaction,email: string,salt: string, password: string, iterations: number, pepperVersion: string): Promise<user & { account:account, refreshToken:refresh_token, password:password}> {
        return prisma.user.create({
            data: {
                email,
                account: {
                    create: {
                    }
                },
                refreshToken: {
                    create: {
                        token: this.generateRefreshToken(),
                    }
                },
                password: {
                    create: {
                        salt,
                        password,
                        iterations,
                        pepperVersion:pepperVersion.toString()
                    }
                },
            },
            include: {
                account: true,
                refreshToken: true,
                password: true
            }
        });
    }

    async createPassword(prisma:transaction,password: Omit<password, "id" | "createdAt" | "updatedAt">): Promise<password> {
        return prisma.password.create({
            data: password
        });
    }

    async createAccountOwnerRole(prisma:transaction, id: bigint, accountId: bigint, permissions: permission[]): Promise<user_role & { role: role}> {
        return prisma.user_role.create({
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

    getPermissions(prisma:transaction): Promise<permission[]> {
        this.logger.debug('Getting permissions');
        return prisma.permission.findMany();
    }


    async transaction<T>(fn: (connection: Omit<PrismaClient, runtime.ITXClientDenyList>) => Promise<T>): Promise<T> {
        return this.prisma.$transaction(async (tx)=> await fn(tx));
    }


    getRefreshToken(userId:number, token: string): Promise<refresh_token | null> {
        return this.prisma.refresh_token.findFirst({
            where: {
                userId: BigInt(userId),
                token,
            }
        })
    }
}
