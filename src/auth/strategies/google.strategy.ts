import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import {SsoPayloadDto} from "../entities";
import {Request} from "express";
import {AuthenticationConf} from "../authentication.conf";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {


    constructor(authenticationConf: AuthenticationConf) {
        super({
            clientID: authenticationConf.google_client_id,
            clientSecret: authenticationConf.google_client_secret,
            callbackURL: authenticationConf.google_redirect_url,
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }

    async validate(request: Request, accessToken: string, refreshToken: string, profile: any): Promise<SsoPayloadDto> {

        const email:string = profile?.emails?.length ? profile.emails[0].value : undefined
        const verified: boolean = profile?.emails?.length ? profile.emails[0].verified : false
        const  firstName: string = profile?.name?.givenName
        const  lastName: string = profile?.name?.familyName
        return {
            id: profile.id,
            username: email,
            email,
            verified,
            firstName,
            lastName,
        }
    }
}
