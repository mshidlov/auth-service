import { createParamDecorator } from '@nestjs/common';
import {SsoPayloadDto} from "../entities";

export const ProfilePayload = createParamDecorator((data, req): SsoPayloadDto => {
  return req.switchToHttp().getRequest().user;
});
