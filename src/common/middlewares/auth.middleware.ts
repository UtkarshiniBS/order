import { HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request
    , Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../service/config.service';
import { CommonModule } from '../module/common-module';

@Injectable()
export class authMiddleware implements NestMiddleware {
    constructor(
        private readonly configService : ConfigService
    ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeaders = req.headers;
    if(authHeaders.accesstoken){
        const headertoken = authHeaders.accesstoken;
        const accesstoken = this.configService.get('ACCESS_TOKEN');
        if (headertoken === accesstoken) {
            next();
        } else {
            throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.UNAUTHORIZED, 'Access token is invalid!', null), HttpStatus.UNAUTHORIZED)
        }       
    } else {
        throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.UNAUTHORIZED, 'User not authorized!', null), HttpStatus.UNAUTHORIZED)
    }
    
  }
}
