import { createParamDecorator } from '@nestjs/common';
import { JwtPayloadDto } from '../entities';

export const JwtPayload = createParamDecorator((data, req): JwtPayloadDto => {
  return req.switchToHttp().getRequest().user;
});
