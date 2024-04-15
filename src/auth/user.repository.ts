import {Injectable} from "@nestjs/common";
import {PrismaService} from "./prisma.service";
import {refreshToken, password, user, privilege} from "@prisma/client";

@Injectable()
export class UserRepository {
    constructor(private prisma: PrismaService) {}

    async findOne(email: string): Promise<user & { password:password, refreshToken:refreshToken} | undefined> {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
            include: {
                password: true,
                refreshToken: true,
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
                                        permissions: {
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
                return acc.concat(it.role.rolePermissions.map(it => it.permissions));
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
}
