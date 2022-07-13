import {
  ExecutionContext,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '../service/config.service';
import { AuthAdapter, DynamicAuthGuard } from './dynamic-auth.guard';

@Injectable()
export class ApiKeyAuthGuard extends DynamicAuthGuard {
  constructor(
    configService: ConfigService,
    httpService: HttpService,
  ) {
    super(configService, httpService);
  }

  async canActivate(context: ExecutionContext) {
    return await this.doApiKeyAuth(context);
  }

  async doApiKeyAuth(context) {
    const request = context.switchToHttp().getRequest();
    if(!(request.headers['authorization'] || request.headers['token'])) {
      return this.handleRequest(null, null, { message: 'Auth Token is missing in headers'})
    }
    if(request.headers['token']) {
      const token = request.headers['token'].split('Bearer ')[1];
      if(token && token === this.configService.get('API_KEY')){
        return true;
      } else {
        return false;
      }
    } else if(request.headers['authorization']) {
      return await super.canActivate(context);
    }
    return this.handleRequest(null, null, { message: 'Auth Token is missing in headers'})
  }
}