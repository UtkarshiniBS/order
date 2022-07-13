import { Request, Response, NextFunction } from "express";
import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { ConfigService } from "../service/config.service";
// import * as Sentry from '@sentry/minimal';
import * as Sentry from "@sentry/node";
// Importing @sentry/tracing patches the global hub for tracing to work.
import * as Tracing from "@sentry/tracing";
const path = require('path');
const fs = require('fs');

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger("HTTP");
    uploadDirectory = __dirname.replace(/src|common|middlewares/g, '').replace("dist", "");

    constructor(
        private readonly configService : ConfigService
    ) {}

    use(req: Request, res: Response, next: NextFunction): void {
        const requestStart = Date.now();
        let errorMessage = null;

        req.on("error", error => {
            errorMessage = error.message;
            logger(req, res, error.message, error);
        });

        res.on("error", error => {
            errorMessage = error.message;
            logger(req, res, error.message, error);
        });

        res.on("finish", () => {
            logger(req, res, errorMessage);
        });

        const logger = async (req: Request, res: Response, errorMessage, error?: any) => {
            const { ip, method, originalUrl, headers, httpVersion, socket, body } = req;
            const { remoteAddress, remoteFamily } = socket;
            const userAgent = req.get("user-agent") || "";
            const { statusCode, statusMessage, } = res;
            const resHeaders = res.getHeaders();
            if (req.file) {
                delete req.file.buffer;
            }
            const logData = {
                method,
                originalUrl,
                statusCode,
                statusMessage,
                timestamp: new Date(),
                processingTime: Date.now() - requestStart,
                userAgent,
                ip,
                errorMessage,
                request: {
                    header: headers,
                    body,
                    file: req.file
                }
            };
            const scraperConfig: any = await this.configService.scrapingConfig();
            const dsn = scraperConfig && scraperConfig.sentry && scraperConfig.sentry.apiDSN ? scraperConfig.sentry.apiDSN : null;
            const isSentryEnabled = scraperConfig && scraperConfig.sentry && scraperConfig.sentry.enabled;
            // Sentry init
            Sentry.init({
                dsn: dsn,
                environment: this.configService.nodeEnv,
                tracesSampleRate: 1.0,
                enabled: isSentryEnabled
            });
            // Log for pproduction as well
            // if(!this.configService.isProduction) {
                this.logger.log(logData);
            // }
            if(isSentryEnabled) {
                const exception = error?.originalError || error?.error || error;
                if(exception) {
                    // Sentry.captureException(exception);
                } else {
                    // const msg = `Method - ${logData.method}, URL - ${logData.originalUrl}`;
                    // Sentry.captureEvent({
                    //     message: msg,
                    //     request: {
                    //         url: logData.originalUrl,
                    //         method: logData.method,
                    //         data: logData.request.body
                    //     }
                    // });
                }
            }

        }
        next();
    }
}