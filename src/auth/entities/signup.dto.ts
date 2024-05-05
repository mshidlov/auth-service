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
    },{
        message: 'password must be longer than or equal to 8 characters, contain at least 1 uppercase letter, 1 special character, and 1 number'
    })
    password: string;
}
