import { PrivilegeEnum } from './privilege.enum';
import { IsArray, IsEnum, IsString } from 'class-validator';

export class PermissionsDto {
  @IsString()
  r: string;

  @IsArray()
  @IsEnum(PrivilegeEnum, { each: true })
  p: PrivilegeEnum[];
}
