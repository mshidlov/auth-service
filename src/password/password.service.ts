import {ConflictException, ForbiddenException, Injectable} from "@nestjs/common";
import {MailingService} from "../auth/mailing.service";
import {TokenService} from "../auth/token.service";
import {PasswordRepository} from "./password.repository";
import {PasswordConfig} from "./password.config";
import {AuthUtils} from "../auth/auth.util";
import {UpdatePasswordDto} from "./entities/update-password.dto";

@Injectable()
export class PasswordService {
    constructor(
        private passwordConfig: PasswordConfig,
        private passwordRepository: PasswordRepository,
        private tokenService: TokenService,
        private mailingService: MailingService,
        private authUtils: AuthUtils) {
    }

    async forgotPassword(email: string): Promise<{ userId: number, emailId: number }> {
        const userEmail = await this.passwordRepository.getEmail(email);
        const token = await this.tokenService.sign({id: userEmail.user.id});
        const resetPasswordLink = `${this.passwordConfig.resetPasswordPageURL}?identity=${encodeURIComponent(token)}`;
        await this.mailingService.sendResetPassword(
            userEmail.email,
            userEmail.user.username,
            resetPasswordLink,
        );
        return {
            userId: Number(userEmail.user.id),
            emailId: Number(userEmail.id)
        }
    }

    async resetPassword(token: string, newPassword: string): Promise<{ userId: number }> {
        const decodedToken = await this.tokenService.verify(token);
        const userId = JSON.parse(decodedToken.payload.substring)?.id;

        const password = await this.passwordRepository.getPassword(userId);
        const history = await this.passwordRepository.getPasswordHistory(userId);
        if ([password, ...history].some(async password => await this.authUtils.isPasswordCorrect(
            password.password,
            password.salt,
            password.iterations,
            newPassword,
        ))) {
            throw new ConflictException('Password already used');
        }

        const hashResult = await this.authUtils.hashPassword(newPassword);
        const savedPassword = await this.passwordRepository.updatePassword(userId, hashResult.salt, hashResult.hash, hashResult.iterations, hashResult.pepperVersion, password);
        return {
            userId: Number(savedPassword.userId)
        }
    }

    async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto) {

        const password = await this.passwordRepository.getPassword(userId);
        if (!await this.authUtils.isPasswordCorrect(
            password.password,
            password.salt,
            password.iterations,
            updatePasswordDto.oldPassword,
        )) {
            throw new ForbiddenException(`Cannot update password for user ${userId}`);
        }
        const history = await this.passwordRepository.getPasswordHistory(userId);
        if ([password, ...history].some(async password => await this.authUtils.isPasswordCorrect(
            password.password,
            password.salt,
            password.iterations,
            updatePasswordDto.newPassword,
        ))) {
            throw new ConflictException('Password already used');
        }
        const hashResult = await this.authUtils.hashPassword(updatePasswordDto.newPassword);
        return await this.passwordRepository.updatePassword(userId, hashResult.salt, hashResult.hash, hashResult.iterations, hashResult.pepperVersion, password)
    }
}