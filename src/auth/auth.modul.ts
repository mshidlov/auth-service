import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import {JwtStrategy} from "./jwt.strategy";
import {UserRepository} from "./user.repository";
import {PrismaService} from "./prisma.service";
import {PassportModule} from "@nestjs/passport";
import {AuthUtils} from "./auth.util";
import {AuthOptions} from "./entities/auth-options.dto";

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' , session: false}),
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: '60s',
            },

        }),
    ],
    providers: [JwtStrategy,{
        provide: AuthOptions,
        useValue: {
            saltLength: 64,
            hashLength: 64,
            iterations: 1,
            digest: 'sha512',
            algorithm: 'pbkdf2',
            pepper: '',
            pepperVersion: 1,
        }
    },AuthUtils,PrismaService, UserRepository, AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
