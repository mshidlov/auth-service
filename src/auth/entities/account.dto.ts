import {ApiProperty} from "@nestjs/swagger";

export class AccountDto{
    @ApiProperty({
        type: Number,
        example: 1
    })
    id: number

    @ApiProperty({
        type: String,
        example: "My Account"
    })
    name: string
}
