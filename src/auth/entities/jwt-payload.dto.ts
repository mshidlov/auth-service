import { PermissionsDto } from './permissions.dto';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class JwtPayloadDto {
  @IsNumber()
  id: number;

  @IsNumber()
  account: number;

  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @IsArray()
  @Type(() => PermissionsDto)
  @ValidateNested({ each: true })
  permissions: PermissionsDto[];

    constructor(partial: Partial<JwtPayloadDto>) {
        Object.assign(this, partial);
    }
}
