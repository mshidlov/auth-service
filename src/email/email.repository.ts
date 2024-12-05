import {Injectable} from "@nestjs/common";
import {user, user_email} from "@prisma/client";
import {LimitationExceedException, UniqueException} from "./exceptions";
import {EmailConfig} from "./email.config";
import {PrismaService} from "../data-access";

@Injectable()
export class EmailRepository {
    constructor(
        private emailConfig: EmailConfig,
        private prismaService: PrismaService) {
    }

    async createEmail(userId: number, email: string): Promise<user_email & { user: user }> {
        try{
            return await this.prismaService.$transaction( async (connection)=>{
                const count = await connection.user_email.count({
                    where: {
                        userId
                    }
                })
                if(count === this.emailConfig.maxAssociatedEmails){
                    throw new LimitationExceedException(`Email limit exceeded for user, cannot add more than ${this.emailConfig.maxAssociatedEmails} emails`);
                }
                return this.prismaService.user_email.create({
                    data: {
                        email,
                        isPrimary: count === 0,
                        user: {
                            connect: {
                                id: userId
                            }
                        }
                    },
                    include: {
                        user: true
                    }
                });
            })

        } catch (error) {
            switch (error.code) {
                case 'P2002':
                    throw new UniqueException('Email already exists');
                default:
                    throw error;
            }
        }
    }

    async getEmail(userId: number, emailId: number) {
        return this.prismaService.user_email.findUnique({
            where: {
                id: BigInt(emailId)
            }
        });
    }

    async getEmails(userId: number) :Promise<user_email[]>{
        return this.prismaService.user_email.findMany({
            where: {
                userId: BigInt(userId)
            }
        });
    }

    async deleteEmail(userId: number, emailId: number): Promise<user_email> {
        return this.prismaService.user_email.delete({
            where: {
                id: BigInt(emailId),
                userId: BigInt(userId)
            }
        });
    }

    async verifyEmail(userId: number, emailId: number) {
        return this.prismaService.user_email.update({
            where: {
                id: BigInt(emailId),
                userId: BigInt(userId)
            },
            data: {
                isVerified: true
            }
        });
    }
}