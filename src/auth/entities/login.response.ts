import {UserDto} from "./user.dto";

export class LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserDto;
}
