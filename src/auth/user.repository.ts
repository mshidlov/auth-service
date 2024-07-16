import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  password,
  user,
  privilege,
  account,
  permission,
  user_role,
  role,
  PrismaClient,
  refresh_token,
  user_email,
} from '@prisma/client';
import * as runtime from '@prisma/client/runtime/library';

type transaction = Omit<PrismaClient, runtime.ITXClientDenyList>;
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<
    | (user & {
        password: password;
        refreshToken: refresh_token;
        account: account;
      })
    | undefined
  > {
    return this.prisma.user.findUnique({
      where: {
        username,
      },
      include: {
        password: true,
        refreshToken: true,
        account: true,
      },
    });
  }

  async getUserRolesAndPermissions(userId: bigint): Promise<{
    roles: string[];
    permissions: { resource: string; privilege: privilege }[];
  }> {
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

  async createRefreshToken(userId: bigint): Promise<refresh_token> {
    return this.prisma.refresh_token.create({
      data: {
        userId,
        token: this.generateRefreshToken(),
      },
    });
  }

  private generateRefreshToken(): string {
    return Math.random().toString(36);
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

  deleteRefreshToken(userId: bigint): Promise<{ count: number }> {
    return this.prisma.refresh_token.deleteMany({
      where: {
        userId,
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
  ): Promise<
    user & {
      account: account;
      refreshToken: refresh_token;
      password: password;
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
        refreshToken: true,
        password: true,
        user_email: true,
      },
    });
  }

  createAccount(
    username: string,
    salt: string,
    password: string,
    iterations: number,
    pepperVersion: string,
  ): Promise<{
    user: user & {
      account: account;
      refreshToken: refresh_token;
      password: password;
      user_email: user_email[];
    };
    permissions: permission[];
    userRole: user_role & { role: role };
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const user = await this.createUser(
        prisma,
        username,
        salt,
        password,
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

  async createPassword(
    prisma: transaction,
    password: Omit<password, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<password> {
    return prisma.password.create({
      data: password,
    });
  }

  private async createAccountOwnerRole(
    prisma: transaction,
    id: bigint,
    accountId: bigint,
    permissions: permission[],
  ): Promise<user_role & { role: role }> {
    return prisma.user_role.create({
      data: {
        user: {
          connect: {
            id,
          },
        },
        role: {
          create: {
            name: 'Account Owner',
            accountId: accountId,
            rolePermissions: {
              create: permissions.map((it) => ({
                permission: {
                  connect: {
                    id: it.id,
                  },
                },
              })),
            },
          },
        },
      },
      include: {
        role: true,
      },
    });
  }

  private getPermissions(prisma: transaction): Promise<permission[]> {
    this.logger.debug('Getting permissions');
    return prisma.permission.findMany();
  }

  async transaction<T>(
    fn: (
      connection: Omit<PrismaClient, runtime.ITXClientDenyList>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => await fn(tx));
  }

  getRefreshToken(
    userId: number,
    token: string,
  ): Promise<(refresh_token & { user: user }) | null> {
    return this.prisma.refresh_token.findFirst({
      where: {
        userId: BigInt(userId),
        token,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * The addEmail function associates an email with a user. If the email is set as primary,
   * it updates any existing primary email to non-primary before adding or updating the email.
   * If no primary email is specified and the user has no emails, it sets the first email as primary.
   *
   * @param userId the associated user the email belongs to
   * @param email email to save
   * @param primary is email primary
   */
  addEmail(
    userId: bigint,
    email: string,
    primary?: boolean,
  ): Promise<user_email & { user: user }> {
    return this.prisma.$transaction(async (connection) => {
      if (primary) {
        await connection.user_email.updateMany({
          where: {
            userId: userId,
          },
          data: {
            isPrimary: false,
          },
        });
        return connection.user_email.upsert({
          where: {
            userId: userId,
            email: email,
          },
          update: {
            isPrimary: true,
          },
          create: {
            user: {
              connect: {
                id: userId,
              },
            },
            email,
          },
          include: {
            user: true,
          },
        });
      }

      const emailsCount: number = await connection.user_email.count({
        where: {
          userId,
        },
      });

      if (emailsCount) {
        return connection.user_email.create({
          data: {
            user: {
              connect: {
                id: userId,
              },
            },
            email,
          },
          include: {
            user: true,
          },
        });
      }

      return connection.user_email.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          email,
          isPrimary: true,
        },
        include: {
          user: true,
        },
      });
    });
  }

  verifyEmail(id: bigint): Promise<user_email> {
    return this.prisma.$transaction(async (connection) => {
      const user_email = await connection.user_email.update({
        where: {
          id,
        },
        data: {
          isVerified: true,
        },
      });

      await connection.user.update({
        where: {
          id: user_email.userId,
        },
        data: {
          isVerified: true,
        },
      });
      return user_email;
    });
  }

  /**
   * The deleteEmail function removes an email address associated with a user, ensuring it is not the primary email.
   * @param userId
   * @param email
   * @throws Error if the email does not exist or if it is the primary email address.
   */
  deleteEmail(userId: bigint, email: string): Promise<user_email> {
    return this.prisma.$transaction(async (connection) => {
      const user_email = await connection.user_email.findFirst({
        where: {
          userId,
          email,
        },
      });

      if (!user_email) {
        throw new Error('Email not found for the specified user.');
      }

      if (user_email.isPrimary) {
        throw new Error(
          'Cannot delete the primary email address for the user.',
        );
      }

      return connection.user_email.delete({
        where: {
          id: user_email.id,
        },
      });
    });
  }
}
