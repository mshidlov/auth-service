import {
    Body,
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Res,
    Get,
    Param,
    Req,
    UseGuards,
    NotImplementedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import {JwtGuard} from "./jwt.guard";
import {JwtPayload} from "./jwt-payload.decorator";
import {JwtPayloadDto} from "./jwt-payload.dto";
import {SignupDto} from "./entities/signup.dto";
import {LoginResponseDto} from "./entities/login-response.dto";
import {LoginDto} from "./entities/login.dto";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() loginDto: LoginDto, @Res() res: Response): Promise<LoginResponseDto> {
        const response = await this.authService.signIn(loginDto.email, loginDto.password);
        res.cookie('access_token', response.access_token, {httpOnly: true});
        res.cookie('refresh_token', response.refresh_token, {httpOnly: true});
        return response;
    }

    @Post('signup')
    async signUp(@Body() signupDto: SignupDto,
                 @Res() res: Response): Promise<LoginResponseDto> {
        const response = await this.authService.signUp({
            ...signupDto
        });
        res.cookie('access_token', response.access_token, {httpOnly: true});
        res.cookie('refresh_token', response.refresh_token, {httpOnly: true});
        return response;
    }

    @Post('forgot-password')
    async forgotPassword(@Body() forgotPassword: { email: string }) : Promise<void> {
        throw new NotImplementedException();
    }

    @Post('reset-password')
    @UseGuards(JwtGuard)
    async resetPassword(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @Body() resetPassword: { password: string }) : Promise<void> {
        throw new NotImplementedException();
    }

    @Get('logout/userId')
    async signOut(
        @Param('userId') userId: number,
        @Res() res: Response): Promise<void> {
        await this.authService.signOut(userId);
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return;
    }

    @Get('refresh')
    async refresh(
        @Req() req: Request,
        @Res() res: Response) : Promise<void> {
        const { access_token, refresh_token} = await this.authService.refresh({
            access_token: req.cookies.access_token || req.headers.authorization,
            refresh_token: req.cookies.refresh_token || req.headers['x-refresh-token'],
        });
        res.cookie('access_token', access_token, { httpOnly: true });
        res.cookie('refresh_token', refresh_token, { httpOnly: true });
        return;
    }

}
