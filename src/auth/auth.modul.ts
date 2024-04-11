import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import {UserService} from "./user.service";

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: '60s',
                issuer: '',

            },

        }),
    ],
    providers: [UserService,AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
