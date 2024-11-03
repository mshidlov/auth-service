import {Body, Controller, Logger, Post, Put, UseGuards} from "@nestjs/common";
import {ForgotPasswordDto} from "./entities/forgot-password.dto";
import {PasswordService} from "./password.service";
import {ApiResponse} from "@nestjs/swagger";
import {ResetPasswordDto} from "./entities/reset-password.dto";
import {JwtGuard} from "../auth/jwt.guard";
import {IntParam, Permissions} from "../decorators";
import {UpdatePasswordDto} from "./entities/update-password.dto";
import {JwtPayload} from "../auth/jwt-payload.decorator";
import {JwtPayloadDto} from "../auth/jwt-payload.dto";


@Controller("user")
export class PasswordController{
    private readonly logger = new Logger(PasswordController.name);
    constructor(private passwordService: PasswordService) {
    }

    @ApiResponse({
        status: 200,
        description: `This API will always return 200 OK to prevent email scraping.
It will send an email to the user with a link to reset the password.
The email will contain a token that will be used to reset the password.
The token will be valid for a certain amount of time.`
    })
    @Post('password/forgot')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto){
        try {
            this.logger.log(`User requested to reset password`);
            const results = await this.passwordService.forgotPassword(forgotPasswordDto.email);
            this.logger.log(`Reset password email sent to email ${results.emailId} for user ${results.userId}`);
        } catch (error) {
            this.logger.error(`Failed to reset password for email ${forgotPasswordDto.email} with error: ${error.message}`);
            throw error;
        }
    }

    @Post('password/reset')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void>{
        try {
            this.logger.log(`User requested to reset password`);
            const results = await this.passwordService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
            this.logger.log(`Password reset for user ${results.userId}`);
        } catch (error) {
            this.logger.error(`Failed to reset password with error: ${error.message}`);
            throw error;
        }
    }

    @UseGuards(JwtGuard)
    @Permissions([{
        resource: 'user',
        action: 'update'
    }])
    @Put(':user-id/password')
    async updatePassword(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @IntParam('user-id') userId: number,
        @Body() updatePasswordDto: UpdatePasswordDto): Promise<void>{
        try {
            this.logger.log(`User ${jwtPayload.id} is updating password for user ${userId}`);
            await this.passwordService.updatePassword(userId, updatePasswordDto);
            this.logger.log(`Password updated for user ${userId} by user ${jwtPayload.id}`);
        } catch (error) {
            this.logger.error(`Failed to update password for user ${userId} by user ${jwtPayload.id} with error: ${error.message}`);
            throw error;
        }
    }
}