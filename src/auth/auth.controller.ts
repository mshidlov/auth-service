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
  NotImplementedException,
  Logger, ForbiddenException, UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtGuard } from './jwt.guard';
import { JwtPayload } from './jwt-payload.decorator';
import { JwtPayloadDto } from './jwt-payload.dto';
import { SignupDto } from './entities';
import { LoginResponseDto } from './entities';
import { LoginDto } from './entities';

@Controller()
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({
      passthrough: true,
    })
    res: Response,
  ): Promise<LoginResponseDto> {
    const response = await this.authService.signIn(
      loginDto.username,
      loginDto.password,
    );
    this.setCookies(res, response.access_token, response.refresh_token);
    return response;
  }


  //TODO: Unique constraint failed on the constraint: `user_username_key`
  @Post('signup')
  async signUp(
    @Body() signupDto: SignupDto,
    @Res({
      passthrough: true,
    })
    res: Response,
  ): Promise<LoginResponseDto> {
    const response = await this.authService.signUp({
      ...signupDto,
    });
    this.logger.log(`User ${response.user.id} signed up`);
    this.setCookies(res, response.access_token, response.refresh_token);
    return response;
  }

  @Post('user/email')
    async sendVerificationEmail(
        @JwtPayload() jwtPayload: JwtPayloadDto,
        @Body() sendVerificationEmail: { email: string },
    ): Promise<void> {
        await this.authService.updateUserEmail(jwtPayload.id,sendVerificationEmail.email);
    }

  @Post('user/email/verify/:JWT')
  async verifyEmail(
    @Param('JWT') JWT: string,
    @Res({
      passthrough: true,
    })
    res: Response,
  ): Promise<void> {
    res.status(HttpStatus.FOUND);
    if (await this.authService.verifyEmail(JWT)) {
      res.location('http://localhost:8080/verify/email/success');
    } else {
      res.location('http://localhost:8080/verify/email/fail');
    }
  }
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPassword: { email: string }, // eslint-disable-line
  ): Promise<void> {
    throw new NotImplementedException();
  }

  @Post('reset-password')
  @UseGuards(JwtGuard)
  async resetPassword(
    @JwtPayload() jwtPayload: JwtPayloadDto, // eslint-disable-line
    @Body() resetPassword: { password: string }, // eslint-disable-line
  ): Promise<void> {
    throw new NotImplementedException();
  }

  @Get('logout/:userId')
  @UseGuards(JwtGuard)
  async signOut(
    @Param('userId') userId: number,
    @JwtPayload() jwt: JwtPayloadDto,
    @Res({
      passthrough: true,
    })
    res: Response,
  ): Promise<void> {
    if(userId != jwt.id){
      throw new ForbiddenException("Action is not allowed")
    }
    await this.authService.signOut(userId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return;
  }

  @Get('refresh')
  async refresh(
    @Req() req: Request,
    @Res({
      passthrough: true,
    })
    res: Response,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    if(!(req.cookies.refresh_token && req.cookies.access_token) && !(req.headers['x-refresh-token'] && req.headers.authorization)){
        throw new UnauthorizedException("Action is not allowed")
    }
    const { access_token, refresh_token } = await this.authService.refresh({
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
}
