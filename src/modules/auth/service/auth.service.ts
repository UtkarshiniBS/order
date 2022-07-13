import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/service/user.service';
import { ConfigService } from '../../../common/service/config.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
      private readonly userService: UserService, 
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (user) {
      const isPasswordMatching = await bcrypt.compare(pass, user.password);
      if(isPasswordMatching) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    }
    return null;
  }

  async login(user: any) {
    const res = await this.userService.findOne(user.username);
    const payload = { username: res.username, id: res.id };
    return {
        ...payload,
      auth_token: this.jwtService.sign(payload),
      access_token: this.configService.get('ACCESS_TOKEN') ? this.configService.get('ACCESS_TOKEN') : null
    };
  }

  async checkToken(token: string) {
    return this.jwtService.verify(token);
  }
}