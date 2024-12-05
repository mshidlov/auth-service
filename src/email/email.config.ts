import {Injectable, OnModuleInit} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EmailConfig{

    private readonly _apiKey: string
    private readonly _fromEmail: string
    private readonly _fromName: string
    private readonly verification_host: string
    private readonly _templateId: string
    private readonly _maxAssociatedEmails: string

    constructor(configService: ConfigService) {
        this._apiKey = configService.get('SENDGRID_API_KEY')
        this._fromEmail = configService.get('SENDGRID_FROM_EMAIL')
        this._fromName = configService.get('SENDGRID_FROM_NAME')
        this.verification_host = configService.get('VERIFICATION_HOST')
        this._templateId = configService.get('SENDGRID_TEMPLATE_ID')
        this._maxAssociatedEmails = configService.get('MAX_ASSOCIATED_EMAILS')
    }

    get apiKey(): string {
        return this._apiKey;
    }

    get fromEmail(): string {
        return this._fromEmail;
    }

    get fromName(): string {
        return this._fromName;
    }

    get verificationHost(): string {
        return this.verification_host;
    }

    get templateId(): string {
        return this._templateId;
    }

    get maxAssociatedEmails(): number {
        return parseInt(this._maxAssociatedEmails);
    }
}