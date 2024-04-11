## Custom Password Hashing and Verification

### AuthOptions Interface

The `AuthOptions` interface is a part of the `AuthUtils` class in our application. It provides a structured way to specify the options for password hashing and verification.

#### Properties

The `AuthOptions` interface includes the following properties:

- `saltLength`: This is a number that specifies the length of the salt that is generated for password hashing. A salt is a random string that is added to the password before hashing to prevent rainbow table attacks.

- `hashLength`: This is a number that specifies the length of the hashed password.

- `iterations`: This is a number that specifies the number of iterations to be used in the password hashing algorithm. More iterations increase the time required to hash and verify passwords, which can provide additional security.

- `digest`: This is a string that specifies the digest algorithm to be used in the password hashing algorithm. It can be 'sha1', 'sha256', or 'sha512'.

- `algorithm`: This is a string that specifies the password hashing algorithm to be used. It can be 'pbkdf2', 'bcrypt', or 'argon2'.

- `pepper`: This is a string that specifies the pepper to be added to the password before hashing. A pepper is similar to a salt, but it is application-wide and kept secret.

#### Usage

Here's an example of how to use the `AuthOptions` interface:

```typescript
const options: AuthOptions = {
    saltLength: 10,
    hashLength: 64,
    iterations: 10000,
    digest: 'sha512',
    algorithm: 'bcrypt', 
    pepper: 's3cr3tP3pp3r'
};

const authUtils = new AuthUtils(options);
```


#### Security
The `AuthOptions` interface and the `AuthUtils` class provide basic functionality for password hashing and verification. However, always make sure to keep up with the latest security practices and consider using established libraries for handling password storage. The security of your system also depends on factors like the security of the stored hashed passwords (they should be stored securely to prevent unauthorized access), the strength of the user passwords (users should be encouraged to use strong passwords), and the security of the system as a whole.
