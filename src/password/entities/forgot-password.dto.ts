import {IsEmail} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ForgotPasswordDto {
    @IsEmail()
    @ApiProperty({
        type: String,
        example: 'example@example.com'
    })
    email: string;
}