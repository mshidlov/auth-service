import {AuthOptions, AuthUtils} from './auth.util';

function createAuthUtils(options: AuthOptions) {
    return new AuthUtils(options);
}
describe('AuthUtils', () => {
    let options: AuthOptions;
    const password = 'password';
    
    beforeEach(() => {
        options = { saltLength: 10, hashLength: 64, iterations: 10000, digest: 'sha512', algorithm: 'pbkdf2' }
    });

    it('should hash password with PBKDF2', async () => {
        options.algorithm = 'pbkdf2';
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);

        expect(passwordHash).toHaveProperty('salt');
        expect(passwordHash).toHaveProperty('hash');
        expect(passwordHash).toHaveProperty('iterations');
    });

    it('should hash password with bcrypt', async () => {
        options.algorithm = 'bcrypt';
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);

        expect(passwordHash).toHaveProperty('salt');
        expect(passwordHash).toHaveProperty('hash');
        expect(passwordHash).toHaveProperty('iterations');
    });

    it('should hash password with argon2', async () => {
        options.algorithm = 'argon2';
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);

        expect(passwordHash).toHaveProperty('salt');
        expect(passwordHash).toHaveProperty('hash');
        expect(passwordHash).toHaveProperty('iterations');
    });

    it('should check password correctly with PBKDF2', async () => {
        options.algorithm = 'pbkdf2';
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);
        const isCorrect = await authUtils.isPasswordCorrect(passwordHash.hash, passwordHash.salt, passwordHash.iterations, password);

        expect(isCorrect).toBe(true);
    });

    it('should check password correctly with bcrypt', async () => {
        options.algorithm = 'bcrypt';
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);
        const isCorrect = await authUtils.isPasswordCorrect(passwordHash.hash, passwordHash.salt, passwordHash.iterations, password);

        expect(isCorrect).toBe(true);
    });

    it('should check password correctly with argon2', async () => {
        options.algorithm = 'argon2';
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);
        const isCorrect = await authUtils.isPasswordCorrect(passwordHash.hash, passwordHash.salt, passwordHash.iterations, password);

        expect(isCorrect).toBe(true);
    });

    it('should check password incorrectly', async () => {
        const authUtils = createAuthUtils(options)
        const passwordHash = await authUtils.hashPassword(password);
        const isCorrect = await authUtils.isPasswordCorrect(passwordHash.hash, passwordHash.salt, passwordHash.iterations, 'wrongpassword');

        expect(isCorrect).toBe(false);
    });

    it('should throw error for unsupported algorithm in hashPassword', async () => {
        options.algorithm = undefined;
        const authUtils = createAuthUtils(options)
        await expect(authUtils.hashPassword(password)).rejects.toThrow('Unsupported algorithm: undefined');
    });

    it('should throw error for unsupported algorithm in isPasswordCorrect', async () => {
        options.algorithm = undefined;
        const authUtils = createAuthUtils(options)
        await expect(authUtils.isPasswordCorrect('hash', 'salt', 10000, password)).rejects.toThrow('Unsupported algorithm: undefined');
    });
});
