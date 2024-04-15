import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import {JwtStrategy} from "./jwt.strategy";
import {UserRepository} from "./user.repository";
import {PrismaService} from "./prisma.service";
import {PassportModule} from "@nestjs/passport";

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
    providers: [JwtStrategy,PrismaService, UserRepository, AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
