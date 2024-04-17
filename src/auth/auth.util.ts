import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { randomBytes, pbkdf2 } from 'crypto';
import { compare, genSalt, hash as bcryptHash } from 'bcrypt';
import { hash as argon2Hash, verify, argon2id } from 'argon2';
import { Logger } from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {JwtPayloadDto} from "./jwt-payload.dto";

interface PasswordHash {
    salt: string;
    hash: string;
    iterations: number;
    pepperVersion: string;
}

type HashingAlgorithm = 'pbkdf2' | 'bcrypt' | 'argon2';
type DigestAlgorithm = 'sha1' | 'sha256' | 'sha512';

export interface AuthOptions {
    saltLength: number;
    hashLength: number;
    iterations: number;
    digest: DigestAlgorithm;
    algorithm: HashingAlgorithm;
    pepper: string;
    pepperVersion: string;
}

export class AuthUtils {
    private readonly logger: Logger = new Logger(AuthUtils.name)

    constructor(private options: AuthOptions,
                private jwtService: JwtService) {
    }

    async hashPassword(password: string): Promise<PasswordHash> {
        this.logger.debug('Hashing password');
        const passwordWithPepper = password + this.options.pepper;
        switch (this.options.algorithm) {
            case 'pbkdf2':
                return this.pbkdf2Hash(passwordWithPepper);
            case 'bcrypt':
                return this.bcryptHash(passwordWithPepper);
            case 'argon2':
                return this.argon2Hash(passwordWithPepper);
            default:
                throw new Error(`Unsupported algorithm: ${this.options.algorithm}`);
        }
    }

    async isPasswordCorrect(savedHash: string, savedSalt: string, savedIterations: number, passwordAttempt: string): Promise<boolean> {
        this.logger.debug('Checking password');
        // Add the pepper to the password attempt before checking
        const passwordAttemptWithPepper = passwordAttempt + this.options.pepper;
        switch (this.options.algorithm) {
            case 'pbkdf2':
                return this.isPbkdf2PasswordCorrect(savedHash, savedSalt, savedIterations, passwordAttemptWithPepper);
            case 'bcrypt':
                return this.isBcryptPasswordCorrect(savedHash, passwordAttemptWithPepper);
            case 'argon2':
                return this.isArgon2PasswordCorrect(savedHash, passwordAttemptWithPepper);
            default:
                throw new Error(`Unsupported algorithm: ${this.options.algorithm}`);
        }
    }

    private pbkdf2Hash(password: string): Promise<PasswordHash> {
        this.logger.debug('Hashing password with PBKDF2');
        const salt = randomBytes(this.options.saltLength).toString('base64');
        return new Promise((resolve, reject) => {
            pbkdf2(password, salt, this.options.iterations, this.options.hashLength, this.options.digest, (err, derivedKey) => {
                if (err) reject(err);
                resolve({
                    salt: salt,
                    hash: derivedKey.toString('hex'),
                    iterations: this.options.iterations,
                    pepperVersion: this.options.pepperVersion
                });
            });
        });
    }

    private async bcryptHash(password: string): Promise<PasswordHash> {
        this.logger.debug('Hashing password with bcrypt');
        const salt = await genSalt(this.options.saltLength);
        const hash = await bcryptHash(password, salt);
        return {
            salt: hash,
            hash: hash,
            iterations: this.options.iterations,
            pepperVersion: this.options.pepperVersion
        };
    }

    private async argon2Hash(password: string): Promise<PasswordHash> {
        this.logger.debug('Hashing password with argon2');
        const hash = await argon2Hash(password, { type: argon2id });
        return {
            salt: '',
            hash: hash,
            iterations: this.options.iterations,
            pepperVersion: this.options.pepperVersion
        };
    }

    private isPbkdf2PasswordCorrect(savedHash: string, savedSalt: string, savedIterations: number, passwordAttempt: string): Promise<boolean> {
        this.logger.debug('Checking password with PBKDF2');
        return new Promise((resolve, reject) => {
            pbkdf2(passwordAttempt, savedSalt, savedIterations, this.options.hashLength, this.options.digest, (err, derivedKey) => {
                if (err) reject(err);
                resolve(savedHash === derivedKey.toString('hex'));
            });
        });
    }

    private async isBcryptPasswordCorrect(savedHash: string, passwordAttempt: string): Promise<boolean> {
        this.logger.debug('Checking password with bcrypt');
        return await compare(passwordAttempt, savedHash);
    }

    private async isArgon2PasswordCorrect(savedHash: string, passwordAttempt: string): Promise<boolean> {
        this.logger.debug('Checking password with argon2');
        return await verify(savedHash, passwordAttempt);
    }

    getUserJWT(jwtPayloadDto: JwtPayloadDto ): string {
        return this.jwtService.sign(jwtPayloadDto);
    }

    async extractJWT(access_token: string): Promise<JwtPayloadDto> {
        const decoded =  this.jwtService.decode(access_token, {json: true})
        const instance = plainToInstance(JwtPayloadDto,decoded, {

        })
        await validateOrReject(instance)
        return instance
    }
}
