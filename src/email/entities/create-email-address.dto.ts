import {OmitType} from "@nestjs/swagger";
import {EmailAddressDto} from "./email-address.dto";

export class CreateEmailAddressDto extends OmitType(EmailAddressDto, ['id', "isPrimary", "isVerified", "updatedAt", "createdAt"] as const) {

}
