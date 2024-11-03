import {applyDecorators, Param, ParseIntPipe} from "@nestjs/common";

export function IntParam(paramName: string) {
  return Param(paramName, ParseIntPipe)
}