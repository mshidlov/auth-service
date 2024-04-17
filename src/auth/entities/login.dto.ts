import {ApiProperty} from "@nestjs/swagger";
import {IsString} from "class-validator";

export class LoginDto{
    @ApiProperty({
        type: String,
        example: "example@example.com"
    })
    @IsString()
    email: string

    @ApiProperty({
        type: String,
        example: "********"
    })
    @IsString()
    password: string
}
