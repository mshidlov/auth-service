import { Module } from '@nestjs/common';
import {AuthModule} from "./auth/auth.modul";

@Module({
  imports: [AuthModule],
})
export class AppModule {}
