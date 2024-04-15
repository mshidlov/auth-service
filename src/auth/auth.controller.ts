import {Body, Controller, Post, HttpCode, HttpStatus, Res, Get, Param, Req, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() signInDto: Record<string, any>, @Res() res: Response) : Promise<void> {
        const { access_token, refresh_token} = await this.authService.signIn(signInDto.username, signInDto.password);
        res.cookie('access_token', access_token, { httpOnly: true });
        res.cookie('refresh_token', refresh_token, { httpOnly: true });
        return;
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
