import {
    Body,
    Controller,
    Get,
    Logger,
    Param,
    ParseIntPipe,
    Post, Req,
    Res,
    UnauthorizedException,
    UseGuards
} from "@nestjs/common";
import {JwtPayloadDto, LoginRequest, LoginResponse, SignupRequest} from "./entities";
import {AuthenticationService} from "./authentication.service";
import {Response, Request} from "express";
import {JwtGuard} from "./guards";
import {JwtPayload} from "./decorators";

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


    //TODO: Unique constraint failed on the constraint: `user_username_key`
    @Post('signup')
    async signup(@Body() signupRequest:SignupRequest,
                 @Res({passthrough: true}) response: Response): Promise<LoginResponse>{
        try {
            this.logger.log(`Signup attempt for user ${signupRequest.username}`);
            const result = await this.authenticationService.signup(signupRequest.password, signupRequest.username, signupRequest.email);
            this.setCookies(response, result.access_token, result.refresh_token);
            this.logger.log(`Signup successful for user ${signupRequest.username}`);
            return result;
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
        if(userId != jwtPayload.id){
            throw new UnauthorizedException("Action is not allowed")
        }
        const token = await this.authenticationService.logout(jwtPayload,userId);
        this.clearCookies(response);
        return;
    }

    @Get('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<Omit<LoginResponse, 'user'>> {
        if(!(req.cookies.refresh_token && req.cookies.access_token) && !(req.headers['x-refresh-token'] && req.headers.authorization)){
            throw new UnauthorizedException("Action is not allowed")
        }
        const { access_token, refresh_token } = await this.authenticationService.refresh({
            cookies: req.cookies.access_token && req.cookies.refresh_token ? {
                access_token: req.cookies.access_token,
                refresh_token: req.cookies.refresh_token,
            } : undefined,
            headers: req.headers.authorization && req.headers['x-refresh-token'] ? {
                access_token: req.headers.authorization,
                refresh_token: req.headers['x-refresh-token'] as string,
            } : undefined,
        });
        this.setCookies(res, access_token, refresh_token);
        return {
            access_token,
            refresh_token,
        };
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