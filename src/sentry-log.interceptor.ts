import { Injectable, Scope, ExecutionContext, CallHandler, NestInterceptor } from "@nestjs/common";
import { SentryInterceptor } from "@ntegral/nestjs-sentry";
import { tap } from 'rxjs/operators';
import { getCurrentHub } from "@sentry/node";

export class SentryLogInterceptor {
//extends SentryInterceptor implements NestInterceptor {

  // configService: any;

  constructor() {
    // super();
    // this.configService = configService;
  }
  intercept(context: ExecutionContext, next: CallHandler) { 
    // const config = this.configDbService.scrapingConfig;
    // if(config && getCurrentHub().getClient() && getCurrentHub().getClient().getOptions()) {
    //   getCurrentHub().getClient().getOptions().enabled = config.sentry && config.sentry.enabled ? config.sentry.enabled : false;
    //   if(config.sentry && config.sentry.enabled) {
    //     return super.intercept(context,next);
    //   }
    // }
    return next
        .handle()
        .pipe(
            tap(null, (exception) => {
              
            }),
        );
  }
}
