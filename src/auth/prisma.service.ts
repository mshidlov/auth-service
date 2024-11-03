import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {Prisma} from ".prisma/client";
import * as process from "node:process";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {


  constructor() {
    const url = process.env.DATABASE_URL
    const password = url.split(":")[2].split("@")[0]
    const confidential = url.replace(password, "*****")
    const updated = url.replace(password, encodeURI(password))
    console.log(`Connecting to ${confidential}`)
    super({
      datasources: {
        db: {
          url: updated,
        },
      },
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
