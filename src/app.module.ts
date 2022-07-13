import { Module, MiddlewareConsumer, RequestMethod, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigService } from './common/service/config.service';
import { SharedModule } from './modules/shared/shared.module';
import { authMiddleware } from './common/middlewares/auth.middleware';
import { OrderHistoryModule } from './modules/order_history/orderHistory.module';
import { PiiDetailsModule } from './modules/pii_details/piiDetails.module';
import { DateRangeModule } from './modules/date-range/date-range.module';
import { ConfigModule } from './modules/config/config.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { ScrappingModule } from './modules/scraping/scraping.module';
import { ConnectionModule } from './modules/connection/connection.module';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { Integrations } from '@sentry/node';
import { SentryLogInterceptor } from './sentry-log.interceptor';
import { KrogerModule } from './modules/kroger/kroger.module';
import { ConfigDbService } from './modules/config/modules/config-db.service';


@Module({
  imports: [
    RavenModule,
    HttpModule,
    UserModule,
    AuthModule,
    SharedModule,
    ConfigService,
    OrderHistoryModule,
    PiiDetailsModule,
    DateRangeModule,
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ConfigService) => {
        return configService.typeOrmConfig;
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname.replace(/src|common|service|/g, '').replace("dist", ''), 'public')
    }),
    SentryModule.forRootAsync({
      imports: [TypeOrmModule],
      useFactory: async (cfg: ConfigService) => {
        const delay = time => new Promise(res=>setTimeout(res,time));
        // Added delay for ORM to initialize
        await delay(7000);
        const config: any = await cfg.scrapingConfig();
        const dsn = config && config.sentry && config.sentry.apiDSN ? config.sentry.apiDSN : null;
        const isSentryEnabled = config && config.sentry && config.sentry.enabled;
        return {
          dsn: dsn,
          environment: cfg.nodeEnv,
          tracesSampleRate: 1.0,
          enabled: isSentryEnabled
        };
      },
      inject: [ConfigService],
    }),
    ConnectionModule,
    ScrappingModule,
    KrogerModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor(),
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useFactory: (config: ConfigDbService) => new SentryLogInterceptor(config),
    //   // useValue: new SentryLogInterceptor(),
    //   inject: [ConfigDbService],
    // }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware)
      .forRoutes({ path: '/users/create', method: RequestMethod.PUT });
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
