import {Injectable, Logger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthenticationConf {
    private readonly logger = new Logger(AuthenticationConf.name);

    google_redirect_url:string
    sso_error_page_url:string
    jwt_secret: string;
    jwt_expire_in: string;
    google_client_id: string;
    google_client_secret: string;
    sso_login_success_redirect_url: string;

    constructor(configService: ConfigService) {
        this.logger.log(`loading authentication config: `);
        this.jwt_secret = configService.get('JWT_SECRET');
        this.logger.log(`            JWT_SECRET = ${this.hideSecretKey(this.jwt_secret)}`);
        this.jwt_expire_in = configService.get('JWT_EXPIRES_IN');
        this.logger.log(`            JWT_EXPIRES_IN = ${this.jwt_expire_in}`);
        this.google_client_id = configService.get('GOOGLE_CLIENT_ID');
        this.logger.log(`            GOOGLE_CLIENT_ID = ${this.google_client_id}`);
        this.google_client_secret = configService.get('GOOGLE_CLIENT_SECRET');
        this.logger.log(`            GOOGLE_CLIENT_SECRET = ${this.hideSecretKey(this.google_client_secret)}`);
        this.google_redirect_url = configService.get('GOOGLE_REDIRECT_URL');
        this.logger.log(`            SSO_REDIRECT_URL = ${this.google_redirect_url}`);
        this.sso_error_page_url = configService.get('SSO_ERROR_PAGE_URL');
        this.logger.log(`            SSO_ERROR_PAGE_URL = ${this.sso_error_page_url}`);
        this.sso_login_success_redirect_url = configService.get('SSO_LOGIN_SUCCESS_REDIRECT_URL');
        this.logger.log(`            SSO_LOGIN_SUCCESS_REDIRECT_URL = ${this.sso_login_success_redirect_url}`);

    }

    private hideSecretKey(secretKey: string): string {
        return secretKey.substring(0, 3) + secretKey.split('').slice(3).map(() => '*').join('');
    }
}