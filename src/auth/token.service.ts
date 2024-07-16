import {Injectable} from "@nestjs/common";

import * as jwt from 'jsonwebtoken';

export interface JwtHeader {
    alg: string | Algorithm;
    typ?: string | undefined;
    cty?: string | undefined;
    crit?: Array<string | Exclude<keyof JwtHeader, "crit">> | undefined;
    kid?: string | undefined;
    jku?: string | undefined;
    x5u?: string | string[] | undefined;
    "x5t#S256"?: string | undefined;
    x5t?: string | undefined;
    x5c?: string | string[] | undefined;
}

export interface JwtPayload {
    [key: string]: any;
    iss?: string | undefined;
    sub?: string | undefined;
    aud?: string | string[] | undefined;
    exp?: number | undefined;
    nbf?: number | undefined;
    iat?: number | undefined;
    jti?: string | undefined;
}

export interface Jwt {
    header: JwtHeader;
    payload: JwtPayload | string;
    signature: string;
}


@Injectable()
export class TokenService {

    constructor(private options:{
        secretKey: string
        expiresIn: string
    }) {
    }

    verify(token: string, options?:{

    }):Jwt {
        return jwt.verify(token,this.options.secretKey,{
            complete: true,
            ...(options || {}),
        })
    }

    decode(token: string, options?:{

    }):Jwt {
        return jwt.verify(token,this.options.secretKey,{
            complete: true,
            ignoreExpiration: true,
            ignoreNotBefore: true,
            ...(options || {}),
        })
    }

    sign(
        payload: string | Buffer | object,
        options?: {
            expiresIn?: string | number | undefined
        }
    ): Promise<string>{
        return new Promise<string>((resolve, reject) => {
            jwt.sign(payload, this.options.secretKey,{
                expiresIn: this.options.expiresIn,
                ...(options || {}),
            },
            (error, encoded) => {
                if(error){
                    reject(error)
                }
                resolve(encoded)
            })
        })
    }
}
