import { Global, HttpModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from '../../common/service/config.service';

const providers = [
    ConfigService
];

@Global()
@Module({
    providers,
    imports: [
        HttpModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
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
    exports: [...providers, HttpModule, JwtModule],
})
export class SharedModule {}
