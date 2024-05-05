import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {INestApplication, UnauthorizedException, ValidationPipe} from '@nestjs/common';
import {LoginResponseDto} from "./entities/login-response.dto";

describe('AuthController - login', () => {
    let app: INestApplication;
    let authService = { signIn: () => {} };

    beforeEach(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService],
        })
            .overrideProvider(AuthService)
            .useValue(authService)
            .overridePipe(new ValidationPipe())
            .useValue(new ValidationPipe({ transform: true, whitelist: true }))
            .compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            transform: true,
            whitelist: true,
        }));
        await app.init();
    });

    it('should return a valid response for valid credentials', async () => {
        const loginResponseDto:LoginResponseDto = {
            user: {
                id: 1,
                account: { id: 1, name: 'My Account' },
                email: 'cdc',
                firstName: 'John',
                lastName: 'Doe',
                roles: ['admin', 'user'],
            },
            access_token: 'access_token',
            refresh_token: 'refresh_token',
        }
        jest.spyOn(authService, 'signIn').mockImplementation( () => loginResponseDto);

        return request(app.getHttpServer())
            .post('/login')
            .send({ email: 'test@test.com', password: 'password' })
            .expect(200)
            .expect(loginResponseDto);
    });

    it('should return 401 Unauthorized for invalid credentials', async () => {
        jest.spyOn(authService, 'signIn').mockImplementation(async () => { throw new UnauthorizedException('Invalid login credentials provided.'); });

        return request(app.getHttpServer())
            .post('/login')
            .send({ email: 'test@test.com', password: 'wrong_password' })
            .expect(401)
            .expect({
                statusCode: 401,
                message: 'Invalid login credentials provided.',
                error: 'Unauthorized',
            });
    });

    it('should return 500 Server error for general error', async () => {
        jest.spyOn(authService, 'signIn').mockImplementation(async () => { throw new Error('General server side error.'); });

        return request(app.getHttpServer())
            .post('/login')
            .send({ email: 'test@test.com', password: 'wrong_password' })
            .expect(500)
            .expect({
                statusCode: 500,
                message: 'Internal server error',
            });
    });

    it('should return 400 Bad Request for invalid payload', () => {
        return request(app.getHttpServer())
            .post('/login')
            .send({ email: 'test@test.com' }) // password is missing
            .expect(400)
            .expect({
                statusCode: 400,
                message: [
                    'password should not be null or undefined',
                    'password must be a string',
                ],
                error: 'Bad Request',
            })

    });


    it('should return 404 Not Found for non-post method', () => {
        return request(app.getHttpServer())
            .get('/login')
            .expect(404);
    });

    afterEach(async () => {
        await app.close();
    });
});

