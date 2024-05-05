import {ApiProperty} from "@nestjs/swagger";
import {IsDefined, IsString} from "class-validator";

export class LoginDto{
    @ApiProperty({
        type: String,
        example: "example@example.com"
    })
    @IsString()
    @IsDefined()
    email: string

    @ApiProperty({
        type: String,
        example: "********"
    })
    @IsString()
    @IsDefined()
    password: string
}
