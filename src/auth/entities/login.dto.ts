import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    type: String,
    example: 'john99',
  })
  @IsString()
  @IsDefined()
  username: string;

  @ApiProperty({
    type: String,
    example: '********',
  })
  @IsString()
  @IsDefined()
  password: string;
}
