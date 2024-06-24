import { UserDto } from './user.dto';

export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: UserDto;
}
