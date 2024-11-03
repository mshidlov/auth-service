import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  ConflictException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { LoginResponseDto } from './entities/login-response.dto';
import {SignupDto} from "./entities";

describe('AuthController - login', () => {
  let app: INestApplication;
  const authService = { signIn: () => {} };

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
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  it('should return a valid response for valid credentials', async () => {
    const loginResponseDto: LoginResponseDto = {
      user: {
        id: 1,
        account: { id: 1, name: 'My Account' },
        username: 'cdc',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['admin', 'user'],
      },
      access_token: 'access_token',
      refresh_token: 'refresh_token',
    };
    jest
      .spyOn(authService, 'signIn')
      .mockImplementation(() => loginResponseDto);

    return request(app.getHttpServer())
      .post('/login')
      .send({ email: 'test@test.com', password: 'password' })
      .expect(200)
      .expect(loginResponseDto);
  });

  it('should return 401 Unauthorized for invalid credentials', async () => {
    jest.spyOn(authService, 'signIn').mockImplementation(async () => {
      throw new UnauthorizedException('Invalid login credentials provided.');
    });

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
    jest.spyOn(authService, 'signIn').mockImplementation(async () => {
      throw new Error('General server side error.');
    });

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
      });
  });

  it('should return 404 Not Found for non-post method', () => {
    return request(app.getHttpServer()).get('/login').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });


});

describe('AuthController - signup', () => {
  let app: INestApplication;
  const authService = { signUp: () => {} };

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
    app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
    );
    await app.init();
  });

  it('should return 200 OK for valid signup', async () => {
    const signupResponseDto: LoginResponseDto = {
      user: {
        id: 1,
        account: { id: 1, name: 'My Account' },
        username: 'cdc',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['admin', 'user'],
      },
      access_token: 'access_token',
      refresh_token: 'refresh_token',
    };
    jest.spyOn(authService, 'signUp').mockImplementation(() => signupResponseDto);

    const signupDto: SignupDto = {
      username: 'cdc',
      password: 'Password1!',
    };

    const response = await request(app.getHttpServer())
        .post('/signup')
        .send(signupDto)
        .expect(200);

    expect(response.body).toEqual(signupResponseDto);
  });

  it('should set access_token cookie for valid signup', async () => {
    const signupResponseDto: LoginResponseDto = {
      user: {
        id: 1,
        account: { id: 1, name: 'My Account' },
        username: 'cdc',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['admin', 'user'],
      },
      access_token: 'access_token',
      refresh_token: 'refresh_token',
    };
    jest.spyOn(authService, 'signUp').mockImplementation(() => signupResponseDto);

    const signupDto: SignupDto = {
      username: 'cdc',
      password: 'Password1!',
    };

    const response = await request(app.getHttpServer())
        .post('/signup')
        .send(signupDto)
        .expect(200);

    expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token'),
        ]),
    );
  });

  it('should set refresh_token cookie for valid signup', async () => {
    const signupResponseDto: LoginResponseDto = {
      user: {
        id: 1,
        account: { id: 1, name: 'My Account' },
        username: 'cdc',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['admin', 'user'],
      },
      access_token: 'access_token',
      refresh_token: 'refresh_token',
    };
    jest.spyOn(authService, 'signUp').mockImplementation(() => signupResponseDto);

    const signupDto: SignupDto = {
      username: 'cdc',
      password: 'Password1!',
    };

    const response = await request(app.getHttpServer())
        .post('/signup')
        .send(signupDto)
        .expect(200);

    expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('refresh_token'),
        ]),
    );
  });

  it('should return 409 Conflict for duplicate username', async () => {
    jest.spyOn(authService, 'signUp').mockImplementation(async () => {
      throw new ConflictException('Username already exists.');
    });

    const signupDto: SignupDto = {
      username: 'cdc',
      password: 'Password1!',
    };

    const response = await request(app.getHttpServer())
        .post('/signup')
        .send(signupDto)
        .expect(409);

    expect(response.body).toEqual({
      statusCode: 409,
      message: 'Username already exists.',
      error: 'Conflict',
    });
  });

  it('should return 400 Bad Request for missing password', () => {
    return request(app.getHttpServer())
        .post('/signup')
        .send({ username: 'cdc' }) // missing required fields
        .expect(400)
        .expect({
          statusCode: 400,
          message: [
            'password must be longer than or equal to 8 characters, contain at least 1 uppercase letter, 1 special character, and 1 number',
          ],
          error: 'Bad Request',
        });
  });

  it('should return 400 Bad Request for weak password', () => {
    return request(app.getHttpServer())
        .post('/signup')
        .send({ username: 'cdc', password: 'weakpass' }) // weak password
        .expect(400)
        .expect({
          statusCode: 400,
          message: [
            'password must be longer than or equal to 8 characters, contain at least 1 uppercase letter, 1 special character, and 1 number',
          ],
          error: 'Bad Request',
        });
  });

  it('should return 400 Bad Request for missing username', () => {
    return request(app.getHttpServer())
        .post('/signup')
        .send({ password: 'Password1!' }) // missing username
        .expect(400)
        .expect({
          statusCode: 400,
          message: [
            'username should not be empty',
          ],
          error: 'Bad Request',
        });
  });

  it('should return 400 Bad Request for empty payload', () => {
    return request(app.getHttpServer())
        .post('/signup')
        .send({}) // empty payload
        .expect(400)
        .expect({
          statusCode: 400,
          message: [
            'username should not be empty',
            'password must be longer than or equal to 8 characters, contain at least 1 uppercase letter, 1 special character, and 1 number',
          ],
          error: 'Bad Request',
        });
  });

  afterEach(async () => {
    await app.close();
  });
});