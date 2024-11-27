import {IsDefined, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class LoginRequest {
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