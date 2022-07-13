import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../../common/service/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET_KEY'),
      ignoreExpiration: false,
      signOptions: {
        expiresIn: configService.getNumber('JWT_EXPIRATION_TIME'),
      }
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}