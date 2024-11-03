import {Injectable} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PasswordConfig{

    private readonly _reset_password_page_url: string

    constructor(configService: ConfigService) {
        this._reset_password_page_url = configService.get<string>('PASSWORD_RESET_PAGE_URL')
    }

    get resetPasswordPageURL(): number {
        return parseInt(this._reset_password_page_url);
    }
}