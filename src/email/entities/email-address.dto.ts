import {IsBoolean, IsDate, IsEmail, IsNotEmpty, IsNumber} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class EmailAddressDto {

    @ApiProperty({
        type: Number,
        example: 1,
    })
    @IsNumber()
    id: number

    @ApiProperty({
        type: String,
        example: 'example@example.com'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        type: Boolean,
        example: true
    })
    @IsBoolean()
    isPrimary: boolean;

    @ApiProperty({
        type: Boolean,
        example: true
    })
    @IsBoolean()
    isVerified: boolean;

    @ApiProperty({
        type: Date,
        example: '2021-01-01T00:00:00Z'
    })
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        type: Date,
        example: '2021-01-01T00:00:00Z'
    })
    @IsDate()
    updatedAt: Date;
}