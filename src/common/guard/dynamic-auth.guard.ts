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

export enum AuthAdapter {
  JWT = 'jwt',
  NCP_IRI = 'ncp',
  COINOUT = 'coinout',
}

@Injectable()
export class DynamicAuthGuard extends AuthGuard('jwt') {
  constructor(
    public readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    if (this.configService.get('AUTH_ADAPTER') === AuthAdapter.NCP_IRI) {
      // return await this.doNcpAuth(context);
      return true;
    }
    if (this.configService.get('AUTH_ADAPTER') === AuthAdapter.COINOUT) {
      return await this.doCoinoutAuth(context);
    }
    return super.canActivate(context);
  }

  async doNcpAuth(context) {
    let url = `${this.configService.get('AUTH_URL')}?username=`;
    const request = context.switchToHttp().getRequest();
    if(!request.headers['panelist_id']) {
      return this.handleRequest(null, null, { message: 'panelist_id is missing in headers'})
    }
    if(!request.headers['authorization']) {
      return this.handleRequest(null, null, { message: 'Auth Token is missing in headers'})
    }
    const token = request.headers['authorization'].split('Bearer ')[1];
    const panelistId = request.headers['panelist_id'];
    url += panelistId;
    try {
      const res = await this.httpService.post(url,
        `gtoken=${token}&encoded=true`,
        { 
          headers: {
            'panelistid': panelistId,
            'Content-Type': 'text/plain'
          }
        }
      ).toPromise();
      if(res.data && res.data.success) {
        return true;
      }
      return false;
    } catch(e) {
      return this.handleRequest(null, null, { message: e.response.data.responseMessage })
    }
  }

  async doCoinoutAuth(context) {
    let url = this.configService.get('AUTH_URL');
    const request = context.switchToHttp().getRequest();
    if(!request.headers['authorization']) {
      return this.handleRequest(null, null, { message: 'Auth Token is missing in headers'})
    }
    let token = request.headers['authorization'].split('Bearer ')[1];
    if(['development','local','staging','qa'].includes(this.configService.nodeEnv)) {
      token = this.configService.get('AUTH_USER');
    }
    try {
      const res = await this.httpService.get(`${url}/${token}`).toPromise();
      if(res.data && res.data.valid) {
        return true;
      }
      return false;
    } catch(e) {
      return this.handleRequest(null, null, { message: e.response.data.responseMessage })
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err ||
        new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: info.message ? info.message : null,
          error: err,
          data: null,
          isError: true,
        });
    }
    return user;
  }
}