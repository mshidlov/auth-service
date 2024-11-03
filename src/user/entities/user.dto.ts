import {ApiProperty} from "@nestjs/swagger";
import {IsBoolean, IsDate, IsNumber, IsString} from "class-validator";

export class UserDto {
    @ApiProperty({
        type: Number,
        example: 1,
    })
    @IsNumber()
    id: number

    @ApiProperty({
        type: String,
        example: 'username',
    })
    @IsString()
    username: string

    @ApiProperty({
        type: String,
        example: 'John',
    })
    @IsString()
    firstName: string

    @ApiProperty({
        type: String,
        example: 'Doe',
    })
    @IsString()
    lastName: string

    @ApiProperty({
        type: Boolean,
        example: true,
    })
    @IsBoolean()
    isVerified: boolean

    @ApiProperty({
        type: Boolean,
        example: false,
    })
    @IsBoolean()
    isBlocked: boolean

    @ApiProperty({
        type: Boolean,
        example: false,
    })
    @IsBoolean()
    isDeleted: boolean

    @ApiProperty({
        type: Number,
        example: 1,
    })
    @IsNumber()
    accountId: number

    @ApiProperty({
        type: Date,
        example: '2021-08-17T15:00:00.000Z',
    })
    @IsDate()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2021-08-17T15:00:00.000Z',
    })
    @IsDate()
    updatedAt: Date
}