import {Injectable, NotFoundException} from "@nestjs/common";
import {UserRepository} from "./user.repository";
import {UserDto} from "./entities";
import {UpdateUserDto} from "./entities/update-user.dto";

@Injectable()
export class UserService{
    constructor(private userRepository: UserRepository) {
    }

    async getUser(userId: number): Promise<UserDto>{
        const user = await this.userRepository.getUser(userId);
        if(user){
            return {
                id: Number(user.id),
                username: user.username,
                accountId: Number(user.accountId),
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified,
                isBlocked: user.isBlocked,
                isDeleted: user.isDeleted,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        }
        throw new NotFoundException(`User with id ${userId} not found`);
    }

    async updateUser(userId: number, updateUserDto:UpdateUserDto): Promise<UserDto> {
        const user = await this.userRepository.updateUser(userId, {
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName,
        });
        if(user){
            return {
                id: Number(user.id),
                username: user.username,
                accountId: Number(user.accountId),
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified,
                isBlocked: user.isBlocked,
                isDeleted: user.isDeleted,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        }
        throw new NotFoundException(`User with id ${userId} not found`);

    }
}