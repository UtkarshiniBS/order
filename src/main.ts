import { NestFactory, Reflector, } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";

import * as compression from 'compression';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { Transport } from '@nestjs/microservices';
import * as Sentry from "@sentry/node";

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/bad-request.filter';
import { QueryFailedFilter } from './common/filters/query-failed.filter';
import { ConfigService } from './common/service/config.service';
import { SharedModule } from './modules/shared/shared.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initSwagger } from './swagger.method';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));
  
  const reflector = app.get(Reflector);

  app.useGlobalFilters(
    new HttpExceptionFilter(reflector),
    new QueryFailedFilter(reflector),
);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: false,
        transform: true,
        dismissDefaultMessages: true,
        validationError: {
          target: false,
        },
    }),
  );
  const configService = app.select(SharedModule).get(ConfigService);
  
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
        port: configService.getNumber('TRANSPORT_PORT'),
        retryAttempts: 5,
        retryDelay: 3000,
    },
});

  await app.startAllMicroservicesAsync();

  initSwagger(app, configService);
  
  await app.listen(configService.getNumber('PORT'));

  let url = await app.getUrl();
  url = url.replace("[::1]", "127.0.0.1");
  console.log(`Server is running at ${url}/api`);

}
bootstrap();