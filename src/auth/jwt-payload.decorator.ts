import {createParamDecorator} from "@nestjs/common";
import {JwtPayloadDto} from "./jwt-payload.dto";

export const JwtPayload = createParamDecorator((data, req): JwtPayloadDto => {
    return req.switchToHttp().getRequest().user
})
