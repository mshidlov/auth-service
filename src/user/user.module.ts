import {Module} from "@nestjs/common";
import {UserController} from "./user.controller";
import {UserRepository} from "./user.repository";
import {UserService} from "./user.service";
import {PrismaService} from "../data-access";

@Module({
    controllers: [UserController],
    providers: [PrismaService,UserRepository, UserService],
})
export class UserModule { }