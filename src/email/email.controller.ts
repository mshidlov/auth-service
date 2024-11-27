import {Body, Controller, Delete, Get, Logger, Param, Post, Put, UseGuards} from "@nestjs/common";
import {IntParam, Permissions} from "../decorators";
import {EmailAddressDto} from "./entities";
import {EmailService} from "./email.service";
import {CreateEmailAddressDto} from "./entities/create-email-address.dto";
import {JwtPayloadDto} from "../auth/entities";
import {JwtPayload, Public} from "../auth/decorators";
import {JwtGuard} from "../auth/guards";

@UseGuards(JwtGuard)
@Controller('user')
export class EmailController{
    private readonly logger = new Logger(EmailController.name);

    constructor(private emailService: EmailService) {
    }
    @Post(':user-id/email')
    @Permissions([{
        resource: 'user',
        action: 'update',
    }])
    async createEmail(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId:number,
                      @Body() createEmailAddressDto:CreateEmailAddressDto): Promise<EmailAddressDto> {
        try {
            this.logger.log(`User ${jwtPayload.id} is creating email for user ${userId}`);
            const response = await this.emailService.createEmail(userId,createEmailAddressDto);
            this.logger.log(`Email created for user ${userId} by user ${jwtPayload.id}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to create email for user ${userId} by user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }

    @Get(':user-id/email/:email-id')
    @Permissions([{
        resource: 'user',
        action: 'get',
    }])
    async getEmail(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId:number,
                   @IntParam('email-id') emailId:number): Promise<EmailAddressDto> {
        try {
            this.logger.log(`User ${jwtPayload.id} is getting email ${emailId} for user ${userId}`);
            const response = await this.emailService.getEmail(userId,emailId);
            this.logger.log(`Email ${emailId} fetched for user ${userId} by user ${jwtPayload.id}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to get email ${emailId} for user ${userId} by user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }

    @Permissions([{
        resource: 'user',
        action: 'get',
    }])
    @Get(':user-id/email')
    async getEmails(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId:number): Promise<EmailAddressDto[]> {
        try {
            this.logger.log(`User ${jwtPayload.id} is getting emails for user ${userId}`);
            const response = await this.emailService.getEmails(userId);
            this.logger.log(`Emails fetched for user ${userId} by user ${jwtPayload.id}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to get emails for user ${userId} by user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }

    @Permissions([{
        resource: 'user',
        action: 'delete',
    }])
    @Delete(':user-id/email/:email-id')
    async deleteEmail(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId:number,
        @IntParam('email-id') emailId:number): Promise<void> {
        try {
            this.logger.log(`User ${jwtPayload.id} is deleting email ${emailId} for user ${userId}`);
            await this.emailService.deleteEmail(userId,emailId);
            this.logger.log(`Email ${emailId} deleted for user ${userId} by user ${jwtPayload.id}`);
        } catch (error) {
            this.logger.error(`Failed to delete email ${emailId} for user ${userId} by user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }

    @Public()
    @Get(':user-id/email/:email-id/verify/:token')
    async verifyEmail(
        @IntParam('user-id') userId:number,
        @IntParam('email-id') emailId:number,
        @Param('token') token:string){
        try{
            this.logger.log(`User ${userId} is verifying email ${emailId} with token ${token}`);
            await this.emailService.verifyEmail(userId,emailId,token);
            this.logger.log(`Email ${emailId} verified for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to verify email ${emailId} for user ${userId} with error: ${error.message}`);
            throw error;
        }
    }
}