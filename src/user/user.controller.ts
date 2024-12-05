import {Body, Controller, Delete, Get, Logger, NotImplementedException, Param, Put, UseGuards} from "@nestjs/common";
import {UserDto} from "./entities";
import {IntParam, Permissions} from "../decorators";
import {UserService} from "./user.service";
import {UpdateUserDto} from "./entities/update-user.dto";
import {JwtGuard} from "../auth/guards";
import {JwtPayload} from "../auth/decorators";
import {JwtPayloadDto} from "../auth/entities";

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
    private readonly logger = new Logger(UserController.name);
    constructor(private userService: UserService) {
    }

    @Get(':id')
    // @Permissions([{
    //     resource: 'user',
    //     action: 'get',
    // }])
    async getUser(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @Param() params:any):Promise<UserDto>{
        try {
            this.logger.log(`User ${jwtPayload.id} is getting user ${params.id}`);
            const response = await this.userService.getUser(params.id);
            this.logger.log(`User ${params.id} fetched by user ${jwtPayload.id}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to get user ${params.id} for user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }

    @Put(':user-id')
    @Permissions([{
        resource: 'user',
        action: 'update',
    }])
    async updateUser(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId:number,
        @Body() updateUserDto:UpdateUserDto):Promise<UserDto> {
        try {
            this.logger.log(`User ${jwtPayload.id} is updating user ${userId}`);
            const response = await this.userService.updateUser(userId,updateUserDto);
            this.logger.log(`User ${userId} updated by user ${jwtPayload.id}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to update user ${userId} for user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }

    @Delete(':user-id')
    @Permissions([{
        resource: 'user',
        action: 'delete',
    }])
    async deleteUser(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId:number):Promise<void>{
        throw new NotImplementedException("Delete user is not implemented");
    }
}