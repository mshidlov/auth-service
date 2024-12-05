import {Module} from "@nestjs/common";
import {AuthenticationService} from "./authentication.service";
import {AuthenticationRepository} from "./authentication.repository";
import {AuthUtils} from "./auth.util";
import {PrismaService} from "../data-access";
import {AuthOptions} from "../legacy";
import {TokenService} from "./token.service";
import {AuthenticationController} from "./authentication.controller";

@Module({
    controllers: [AuthenticationController],
    providers: [
        {
            provide: AuthOptions,
            useValue: {
                saltLength: 64,
                hashLength: 64,
                iterations: 1,
                digest: 'sha512',
                algorithm: 'pbkdf2',
                pepper: '',
                pepperVersion: 1,
            },
        },
        PrismaService,
        TokenService,
        AuthUtils,
        AuthenticationRepository,
        AuthenticationService],
})
export class AuthenticationModule { }
