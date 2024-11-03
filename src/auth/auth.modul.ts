import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { serviceTokensConstants} from './constants';
import { UserRepository } from './user.repository';
import { PrismaService } from './prisma.service';
import { AuthUtils } from './auth.util';
import { AuthOptions } from './entities';
import {TokenService} from "./token.service";
import {MailingService} from "./mailing.service";
import {EmailTemplateService} from "./email-template.service";
import * as process from "node:process";

@Module({
  imports: [

  ],
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
    AuthUtils,
    PrismaService,
    UserRepository,
    EmailTemplateService,
    MailingService,
    {
      provide: serviceTokensConstants.JWT_SERVICE_TOKEN,
      useFactory: () => (
          new TokenService({
          expiresIn: process.env.JWT_EXPIRES_IN,
          secretKey: process.env.JWT_SECRET,
        })
      )
    }, {
      provide: serviceTokensConstants.EMAILS_JWT_SERVICE_TOKEN,
      useFactory: () => (
        new TokenService({
          expiresIn: process.env.EMAILS_JWT_EXPIRES_IN,
          secretKey: process.env.JWT_SECRET,
        })
      )
    },
    AuthService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
