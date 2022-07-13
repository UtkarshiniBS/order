import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from '../../common/strategy/local.strategy';
import { JwtStrategy } from '../../common/strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../common/service/config.service';

@Module({
    imports: [UserModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports:[ConfigService],
            useFactory: async (configService: ConfigService) => ({
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                ignoreExpiration: false,
                secret: configService.get('JWT_SECRET_KEY'),
                // if you want to use token with expiration date
                signOptions: {
                    expiresIn: configService.getNumber('JWT_EXPIRATION_TIME'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, ConfigService],
    exports: [PassportModule, AuthService, JwtModule]
})
export class AuthModule { }