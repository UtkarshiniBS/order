import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { STATUS_CODES } from 'http';

import { AuthService } from '../../modules/auth/service/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'user credentials are invalid',
        error: STATUS_CODES[HttpStatus.UNAUTHORIZED],
        data: null,
        isError: true
      });
    }
    return user;
  }
}