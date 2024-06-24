import { AccountDto } from './account.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: AccountDto,
    example: {
      id: 1,
      name: 'My Account',
    },
  })
  account: AccountDto;

  @ApiProperty({
    type: String,
    example: 'example@example.com',
  })
  username: string;

  @ApiPropertyOptional({
    type: String,
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Doe',
  })
  lastName?: string;

  @ApiProperty({
    type: [String],
    example: ['admin', 'user'],
  })
  roles: string[];
}
