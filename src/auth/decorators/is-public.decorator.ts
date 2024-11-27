import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const PUBLIC_DECORATOR_KEY = 'public';
export const Public = (): CustomDecorator =>
  SetMetadata(PUBLIC_DECORATOR_KEY, true);
