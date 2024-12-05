import { Injectable } from "@nestjs/common";
import {password, user, user_email} from "@prisma/client";
import {PrismaService} from "../data-access";

@Injectable()
export class PasswordRepository{
    constructor(private prismaService: PrismaService) {
    }

    async getEmail(email: string): Promise<user_email & { user: user }>{
        return this.prismaService.user_email.findUnique({
            where: {
                email: email
            },
            include: {
                user: true
            }
        });
    }

    async updatePassword(userId: number, salt: string, hashedPassword: string, iterations: number, pepperVersion: string, oldPassword:password):Promise<password> {
        return this.prismaService.$transaction(async (connection)=>{
            if(oldPassword){
                await connection.password_history.create({
                    data: {
                        ...oldPassword
                    }
                })

                await connection.password.delete({
                    where: {
                        userId
                    }
                })
            }
            return connection.password.create({
                data: {
                    salt,
                    password: hashedPassword,
                    iterations,
                    pepperVersion,
                    user: {
                        connect: {
                            id: userId
                        }
                    }
                }
            })
        })
    }

    async getPasswordHistory(userId: number, limit: number = 5): Promise<password[]>{
            return this.prismaService.password_history.findMany({
                where: {
                    userId
                },
                take: limit-1,
                orderBy: {
                    createdAt: 'desc'
                }
        })
    }

    async getPassword(userId: number): Promise<password>{
        return this.prismaService.password.findUnique({
            where: {
                userId
            }
        })
    }
}