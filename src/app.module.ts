import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.modul';
import {UserModule} from "./user";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";

import {JwtStrategy} from "./auth/jwt.strategy";
import {Reflector} from "@nestjs/core";
import {JwtGuard} from "./auth/jwt.guard";
import {AuthOptions} from "./auth";
import * as process from "node:process";
@Module({
  imports: [
      PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    }),AuthModule,UserModule],
    providers: [JwtStrategy,Reflector,JwtGuard,    {
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
    },],
})
export class AppModule {}
