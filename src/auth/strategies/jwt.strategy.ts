import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.fromCookieAsToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  private static fromCookieAsToken = (req: Request): string | undefined => {
    return req?.cookies?.access_token;
  };

  async validate(payload: any): Promise<{
    id: number;
    account: number;
    roles: string[];
    permissions: { resource: string; privilege:string }[];
  }> {
    return {
      id: payload.id,
      account: payload.account,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
