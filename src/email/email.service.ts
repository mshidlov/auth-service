import {ConflictException, Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {CreateEmailAddressDto} from "./entities/create-email-address.dto";
import {EmailAddressDto} from "./entities";
import {MailingService} from "../auth/mailing.service";
import {EmailRepository} from "./email.repository";
import {EmailConfig} from "./email.config";
import {TokenService} from "../auth/token.service";
import {user, user_email} from "@prisma/client";
import {LimitationExceedException, UniqueException} from "./exceptions";

@Injectable()
export class EmailService{

    constructor(private emailConfig: EmailConfig,
                private tokenService: TokenService,
                private mailingService: MailingService,
                private emailRepository: EmailRepository) {
    }

    async createEmail(userId: number, createEmailAddressDto: CreateEmailAddressDto): Promise<EmailAddressDto> {
        let email: user_email & { user: user };
        try{
            email = await this.emailRepository.createEmail(userId, createEmailAddressDto.email);
        } catch (error) {
            switch (error.name) {
                case LimitationExceedException.name:
                    throw new ConflictException(`Cannot add more than ${this.emailConfig.maxAssociatedEmails} emails`);
                case UniqueException.name:
                    throw new ConflictException(`Email ${createEmailAddressDto.email} already exists`);
                default:
                    throw error;
            }
        }
        try {
            await this.sendVerificationEmail(email.id, createEmailAddressDto.email, email.user.username);
        } catch (error) {
            console.error(`Failed to send verification email to ${createEmailAddressDto.email} for user ${userId} with error: ${error.message}`);
        }
        return {
            id: Number(email.id),
            email: email.email,
            isPrimary: email.isPrimary,
            isVerified: email.isVerified,
            createdAt: email.createdAt,
            updatedAt: email.updatedAt,
        }
    }

    async getEmail(userId: number, emailId: number) : Promise<EmailAddressDto>{
        const email = await this.emailRepository.getEmail(userId, emailId);
        if(!email){
            throw new NotFoundException(`Email with id ${emailId} not found for user ${userId}`);
        }
        return {
            id: Number(email.id),
            email: email.email,
            isPrimary: email.isPrimary,
            isVerified: email.isVerified,
            createdAt: email.createdAt,
            updatedAt: email.updatedAt,
        }
    }

    async getEmails(userId: number): Promise<EmailAddressDto[]> {
        const emails = await this.emailRepository.getEmails(userId);
        return emails.map(email => ({
            id: Number(email.id),
            email: email.email,
            isPrimary: email.isPrimary,
            isVerified: email.isVerified,
            createdAt: email.createdAt,
            updatedAt: email.updatedAt,
        }))
    }

    async deleteEmail(userId: number, emailId: number): Promise<void> {
        const email = await this.emailRepository.deleteEmail(userId, emailId);
        if(!email){
            throw new NotFoundException(`Email with id ${emailId} not found for user ${userId}`);
        }
    }

    async verifyEmail(userId: number, emailId: number, token: string) : Promise<EmailAddressDto>{
        const emailIdDecoded = await this.tokenService.verify(token);
        if(emailId.toString() !== emailIdDecoded.payload){
            throw new UnauthorizedException('Invalid token');
        }
        const email = await this.emailRepository.verifyEmail(userId,emailId);
        if(!email){
            throw new NotFoundException(`Email with id ${emailId} not found for user ${userId}`);
        }
        return {
            id: Number(email.id),
            email: email.email,
            isPrimary: email.isPrimary,
            isVerified: email.isVerified,
            createdAt: email.createdAt,
            updatedAt: email.updatedAt,
        }
    }

    private async sendVerificationEmail(
        emailId: bigint,
        email: string,
        username: string,
    ) {
        const JWT = await this.tokenService.sign(emailId.toString());
        const validationLink = `${this.emailConfig.verificationHost}/auth/verify/email/${JWT}`;
        return this.mailingService.sendVerificationEmail(
            email,
            username,
            validationLink,
        );
    }
}