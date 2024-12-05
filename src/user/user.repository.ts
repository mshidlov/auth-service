import {Injectable} from "@nestjs/common";
import {PrismaService} from "../data-access";
import {user} from "@prisma/client";

@Injectable()
export class UserRepository{
    constructor(private prismaService: PrismaService) {
    }

    getUser(id: number): Promise<user>{
        return this.prismaService.user.findUnique({
            where: {
                id: id,
                isDeleted: false
            }
        })
    }

    updateUser(userId: number, user: Omit<user, "id" | "username"  | "accountId" | "isDeleted" | "isVerified" | "isBlocked" | "updatedAt" | "createdAt">) {
        return this.prismaService.user.update({
            where: {
                id: userId,
                isDeleted: false
            },
            data: {
                ...user
            }
        })
    }
}