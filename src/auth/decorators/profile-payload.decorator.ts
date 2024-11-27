import { createParamDecorator } from '@nestjs/common';
import {ProfilePayloadDto} from "../entities";

export const ProfilePayload = createParamDecorator((data, req): ProfilePayloadDto => {
  return req.switchToHttp().getRequest().user;
});
