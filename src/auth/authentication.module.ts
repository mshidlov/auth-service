import {Module} from "@nestjs/common";
import {AuthenticationService} from "./authentication.service";
import {AuthenticationRepository} from "./authentication.repository";
import {AuthUtils} from "./auth.util";
import {PrismaService} from "../data-access";
import {AuthOptions} from "../legacy";

@Module({
    controllers: [AuthenticationModule],
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
        AuthUtils,
        AuthenticationRepository,
        AuthenticationService],
})
export class AuthenticationModule { }
