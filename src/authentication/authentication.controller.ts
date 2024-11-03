import {Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Res, UseGuards} from "@nestjs/common";
import {LoginRequest, LoginResponse, SignupRequest} from "./entities";
import {JwtGuard} from "../auth/jwt.guard";
import {AuthenticationService} from "./authentication.service";
import {Response} from "express";
import {JwtPayload} from "../auth/jwt-payload.decorator";
import {JwtPayloadDto} from "../auth/jwt-payload.dto";

@Controller()
export class AuthenticationController{
    private readonly logger = new Logger(AuthenticationController.name);

    constructor(private authenticationService: AuthenticationService) {
    }

    @Post('login')
    async login(@Body() loginRequest:LoginRequest,
                @Res({ passthrough: true }) response:Response): Promise<LoginResponse>{
        try {
            this.logger.log(`Login attempt for user ${loginRequest.username}`);
            const result = await this.authenticationService.login(loginRequest);
            this.setCookies(response, result.access_token, result.refresh_token);
            this.logger.log(`Login successful for user ${loginRequest.username}`);
            return result;
        } catch (error) {
            this.logger.error(`Login failed for user ${loginRequest.username} with error ${error}`);
            throw error;
        }
    }

    @Post('signup')
    async signup(@Body() signupRequest:SignupRequest): Promise<void>{
        try {
            this.logger.log(`Signup attempt for user ${signupRequest.username}`);
            await this.authenticationService.signup(signupRequest.password, signupRequest.username, signupRequest.email);
            this.logger.log(`Signup successful for user ${signupRequest.username}`);
        } catch (error) {
            this.logger.error(`Signup failed for user ${signupRequest.username}`);
            throw error;
        }
    }

    @UseGuards(JwtGuard)
    @Get('logout/:user-id')
    async logout(@JwtPayload() jwtPayload:JwtPayloadDto,
                    @Param('user-id', ParseIntPipe) userId: number,
                    @Res({ passthrough: true }) response:Response):Promise<void>{
        try {
            this.logger.log(`Logout attempt for user ${userId}`);
            const token = await this.authenticationService.logout(jwtPayload,userId);
            this.clearCookies(response);
            this.logger.log(`Logout successful for user ${userId} token ${token.id} was deleted`);
        } catch (error) {
            this.logger.error(`Logout failed for user ${userId} with error ${error}`);
            throw error;
        }
    }

    @Get('refresh')
    async refresh(){
        throw new Error('Not implemented');
    }


    private setCookies(
        res: Response,
        access_token: string,
        refresh_token: string,
    ) {
        res.cookie('access_token', access_token, { httpOnly: true, secure: true });
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: true,
        });
    }

    private clearCookies(
        res: Response,
    ) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
    }
}