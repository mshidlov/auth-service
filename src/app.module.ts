import { Module } from '@nestjs/common';
import {UserModule} from "./user";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";

import {Reflector} from "@nestjs/core";
import * as process from "node:process";
import {AuthenticationModule} from "./auth/authentication.module";
import {GoogleStrategy, JwtStrategy} from "./auth/strategies";
import {JwtGuard} from "./auth/guards";
import {DataAccessModule} from "./data-access/data-access.module";
import {GlobalConfigurationsModule} from "./global-configurations.module";
import {AuthOptions} from "./auth/entities/auth-options.dto";
@Module({
  imports: [
    GlobalConfigurationsModule,
    DataAccessModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    }),
    AuthenticationModule,
    UserModule],
    providers: [JwtStrategy, GoogleStrategy,Reflector,JwtGuard,    {
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
