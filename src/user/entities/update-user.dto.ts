import {OmitType} from "@nestjs/swagger";
import {UserDto} from "./user.dto";

export class UpdateUserDto extends OmitType(UserDto, ['id', "username", "updatedAt", "createdAt", "accountId", "isVerified", "isDeleted", "isBlocked"] as const) {
}