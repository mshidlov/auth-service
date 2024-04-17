import {IsEmail, IsString, IsStrongPassword, Matches, MaxLength, MinLength} from "class-validator";

export class SignupDto{
    @IsEmail()
    email: string;
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
    password: string;
}
