import { isArray, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';


export enum IntervalType {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export enum ScrappingType {
  REPORT = "report",
  HTML = "html",
  NONE = 'none'
}

export class scraperIntervalDto {
  @Type(() => Number)
  @IsInt({ message: 'value# should be integer'})
  @IsNotEmpty({ message: "value# should not be empty" })
  @ApiProperty({required: true})
  value: number;

  @IsEnum(IntervalType,{message:'type# should be day/week/month/year'})
  @IsNotEmpty({ message: "type# should not be empty" })
  @ApiProperty({
    required: true,
    enum:IntervalType
  })
  type: IntervalType; 
}

export class SentryDto {
  @Type(() => Boolean)
  @IsBoolean({message: 'enabled# should be boolean'})
  @ApiProperty()
  enabled: Boolean;

  @IsString({ message: 'apiDSN# should be string'})
  @IsNotEmpty({ message: "apiDSN# should not be empty" })
  @ApiProperty()
  apiDSN: string;

  @IsString({ message: 'androidDSN# should be string'})
  @IsNotEmpty({ message: "androidDSN# should not be empty" })
  @ApiProperty()
  androidDSN: string;

  @IsString({ message: 'iosDSN# should be string'})
  @IsNotEmpty({ message: "iosDSN# should not be empty" })
  @ApiProperty()
  iosDSN: string;
}

export class ScrapingScripVersiontDto {
  @IsString({ message: 'amazon# should be string'})
  @IsNotEmpty({ message: "amazon# should not be empty" })
  @ApiProperty()
  amazon: string;

  @IsString({ message: 'instacart# should be string'})
  @IsNotEmpty({ message: "instacart# should not be empty" })
  @ApiProperty()
  instacart: string;

  @IsString({ message: 'walmart# should be string'})
  @IsNotEmpty({ message: "walmart# should not be empty" })
  @ApiProperty()
  walmart: string;

  @IsString({ message: 'kroger# should be string'})
  @IsNotEmpty({ message: "kroger# should not be empty" })
  @ApiProperty()
  kroger: string;
}

export class AuthScriptVersionDto {
  @IsString({ message: 'amazon# should be string'})
  @IsNotEmpty({ message: "amazon# should not be empty" })
  @ApiProperty()
  amazon: string;

  @IsString({ message: 'instacart# should be string'})
  @IsNotEmpty({ message: "instacart# should not be empty" })
  @ApiProperty()
  instacart: string;

  @IsString({ message: 'walmart# should be string'})
  @IsNotEmpty({ message: "walmart# should not be empty" })
  @ApiProperty()
  walmart: string;

  @IsString({ message: 'kroger# should be string'})
  @IsNotEmpty({ message: "kroger# should not be empty" })
  @ApiProperty()
  kroger: string;
}

export class commonMessagesDto {
  @IsOptional()
  @IsString({ message: 'noInternetConnection# should be string'})
  @IsNotEmpty({ message: "noInternetConnection# should not be empty" })
  @ApiPropertyOptional()
  noInternetConnection: string;

  @IsOptional()
  @IsString({ message: 'invalidEmail# should be string'})
  @IsNotEmpty({ message: "invalidEmail# should not be empty" })
  @ApiPropertyOptional()
  invalidEmail: string;

  @IsOptional()
  @IsString({ message: 'invalidPassword# should be string'})
  @IsNotEmpty({ message: "invalidPassword# should not be empty" })
  @ApiPropertyOptional()
  invalidPassword: string;

  @IsOptional()
  @IsString({ message: 'unexpectedError# should be string'})
  @IsNotEmpty({ message: "unexpectedError# should not be empty" })
  @ApiPropertyOptional()
  unexpectedError: string;

  @IsOptional()
  @IsString({ message: 'unknownUrl# should be string'})
  @IsNotEmpty({ message: "unknownUrl# should not be empty" })
  @ApiPropertyOptional()
  unknownUrl: string;

  @IsOptional()
  @IsString({ message: 'loadingPageError# should be string'})
  @IsNotEmpty({ message: "loadingPageError# should not be empty" })
  @ApiPropertyOptional()
  loadingPageError: string;

  @IsOptional()
  @IsString({ message: 'defaultErrorMessage# should be string'})
  @IsNotEmpty({ message: "defaultErrorMessage# should not be empty" })
  @ApiPropertyOptional()
  defaultErrorMessage: string;

  @IsOptional()
  @IsString({ message: 'serviceUnavailable# should be string'})
  @IsNotEmpty({ message: "serviceUnavailable# should not be empty" })
  @ApiPropertyOptional()
  serviceUnavailable: string;

  @IsOptional()
  @IsString({ message: 'defaultTimeoutErrorMessage# should be string'})
  @IsNotEmpty({ message: "defaultTimeoutErrorMessage# should not be empty" })
  @ApiPropertyOptional()
  defaultTimeoutErrorMessage: string;

}

export class ConfigDto {
  
  @Type(() => String)
  @IsNotEmpty({ message: "start_date# should not be empty" })
  @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
    message:`start_date# should be proper date`
  })
  @ApiProperty({required: true})
  start_date: Date;

  @ValidateNested({ each: true })
  @Type(() => scraperIntervalDto)
  @ApiProperty({required: true})
  @IsNotEmpty({ message: "scraping_interval# should not be empty" })
  @IsObject({ message: "scraping_interval# should be a object" })
  scraping_interval: scraperIntervalDto;

  @IsNotEmpty({ message: "scrapping_type# should not be empty" })
  @IsEnum(ScrappingType,{message:'scrapping_type# should be report/html'})
  @ApiPropertyOptional({enum:ScrappingType})
  scrapping_type: ScrappingType;

  @IsNotEmpty({ message: "intial_scrapping_type# should not be empty" })
  @IsEnum(ScrappingType,{message:'intial_scrapping_type# should be report/html'})
  @ApiPropertyOptional({enum:ScrappingType})
  intial_scrapping_type: ScrappingType; 

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 },{ message: 'timeoutValue# should be valid number with max 3 decimal precision'})
  @ApiPropertyOptional()
  timeoutValue: Number;

  @ValidateNested({ each: true })
  @Type(() => SentryDto)
  @ApiProperty({required: true})
  @IsNotEmpty({ message: "Sentry# should not be empty" })
  @IsObject({ message: "Sentry# should be a object" })
  sentry: SentryDto;

  @ValidateNested({ each: true })
  @Type(() => ScrapingScripVersiontDto)
  @ApiProperty({required: true})
  @IsNotEmpty({ message: "scrapingScript# should not be empty" })
  @IsObject({ message: "scrapingScript# should be a object" })
  scrapingScriptVersion: ScrapingScripVersiontDto;

  @ValidateNested({ each: true })
  @Type(() => AuthScriptVersionDto)
  @ApiProperty({required: true})
  @IsNotEmpty({ message: "authScriptVersion# should not be empty" })
  @IsObject({ message: "authScriptVersion# should be a object" })
  authScriptVersion: AuthScriptVersionDto;

  @ValidateNested({ each: true })
  @Type(() => commonMessagesDto)
  @ApiProperty({required: true})
  @IsNotEmpty({ message: "commonMessages# should not be empty" })
  @IsObject({ message: "commonMessages# should be a object" })
  commonMessages: commonMessagesDto;

  @IsOptional()
  @IsArray({ message: "manualScrapeIncentiveDays# should be array" })
  @IsNotEmpty({ message: "manualScrapeIncentiveDays# should not be empty" })
  @ApiProperty({ name: "manualScrapeIncentiveDays", type: [String], required: true })
  manualScrapeIncentiveDays: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{ message: 'manualScrapeIncentiveThreshold# should be valid number'})
  @ApiPropertyOptional()
  manualScrapeIncentiveThreshold: Number;
    
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlatformConfigDto)
  @IsNotEmpty({ message: "platformSourceConfig# should not be empty" })
  @IsArray({ message: "platformSourceConfig# should be a array" })
  @ApiPropertyOptional()
  platformSourceConfig: [PlatformConfigDto];
}

export class PlatformSourceUrlDto {

  @IsOptional()
  @IsString({ message: 'login# should be string'})
  @IsNotEmpty({ message: "login# should not be empty" })
  @ApiPropertyOptional()
  login: string;

  @IsOptional()
  @IsString({ message: 'listing# should be string'})
  @IsNotEmpty({ message: "listing# should not be empty" })
  @ApiPropertyOptional()
  listing: string;

  @IsOptional()
  @IsString({ message: 'details# should be string'})
  @IsNotEmpty({ message: "details# should not be empty" })
  @ApiPropertyOptional()
  details: string;

}

export class OrderUploadDto {

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({message: 'isReportUploadEnabled# should be boolean'})
  @ApiPropertyOptional()
  isReportUploadEnabled: Boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'scrappingDaysElapsed# should be number'})
  @ApiPropertyOptional()
  scrappingDaysElapsed: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'captchaRetries# should be number'})
  @ApiPropertyOptional()
  captchaRetries: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'cooloffPeriodCaptcha# should be number'})
  @ApiPropertyOptional()
  cooloffPeriodCaptcha: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'reportUploadRetries# should be number'})
  @ApiPropertyOptional()
  reportUploadRetries: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'htmlUploadRetries# should be number'})
  @ApiPropertyOptional()
  htmlUploadRetries: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'orderDetailDelay# should be number'})
  @ApiPropertyOptional()
  orderDetailDelay: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'orderUploadRetryCount# should be number'})
  @ApiPropertyOptional()
  orderUploadRetryCount: Number;
  
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 },{ message: 'manualScrapingReportTimeoutValue# should be valid number'})
  @ApiPropertyOptional()
  manualScrapingReportTimeoutValue: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 },{ message: 'manualScrapingHtmlTimeoutValue# should be valid number'})
  @ApiPropertyOptional()
  manualScrapingHtmlTimeoutValue: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'uploadBatchSize# should be number'})
  @ApiPropertyOptional()
  uploadBatchSize: Number;
}

export class MessagesDto {
  @IsString({ message: "manualScrapeTimeoutMessage# should string" })
  @IsNotEmpty({ message: "manualScrapeTimeoutMessage# should not be empty" })
  @ApiPropertyOptional({ name: "manualScrapeTimeoutMessage", type: [String], required: true })
  manualScrapeTimeoutMessage: string;
}
export class ConnectionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'captchaRetries# should be number'})
  @ApiPropertyOptional()
  captchaRetries: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'cooloffPeriodCaptcha# should be number'})
  @ApiPropertyOptional()
  cooloffPeriodCaptcha: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'loginRetries# should be number'})
  @ApiPropertyOptional()
  loginRetries: Number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'otherRetryCount# should be number'})
  @ApiPropertyOptional()
  otherRetryCount: Number;
}

export class PlatformConfigDto {
  // @IsOptional()
  // @Type(() => String)
  // @ApiPropertyOptional()
  // @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
  //     message:`startDate# should be proper date`
  // })
  // startDate: Date;
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
    message:`start_date# should be proper date`
  })
  start_date: Date;
  
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => scraperIntervalDto)
  @IsObject({ message: "scraping_interval# should be a object" })
  @ApiPropertyOptional()
  scraping_interval: scraperIntervalDto;
  
  @IsString({ message: "platformSource# should string" })
  @IsNotEmpty({ message: "platformSource# should not be empty" })
  @ApiPropertyOptional({ name: "platformSource", type: [String], required: true })
  platformSource: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({message: 'enableScraping# should be boolean'})
  @ApiPropertyOptional()
  enableScraping: Boolean;

  @IsOptional()
  @IsEnum(IntervalType,{message:'intervalType# should be day/week/month/year'})
  @ApiPropertyOptional({enum:IntervalType})
  intervalType: IntervalType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 },{ message: 'timeoutValue# should be valid number with max 3 decimal precision'})
  @ApiPropertyOptional()
  timeoutValue: Number; 

  @ValidateNested({ each: true })
  @Type(() => PlatformSourceUrlDto)
  @IsNotEmpty({ message: "urls# should not be empty" })
  @IsObject({ message: "urls# should be a object" })
  @ApiPropertyOptional()
  urls: PlatformSourceUrlDto;

  @ValidateNested({ each: true })
  @Type(() => ConnectionsDto)
  @IsNotEmpty({ message: "connections# should not be empty" })
  @IsObject({ message: "connections# should be a object" })
  @ApiPropertyOptional()
  connections: ConnectionsDto;

  @ValidateNested({ each: true })
  @Type(() => OrderUploadDto)
  @IsNotEmpty({ message: "orderUpload# should not be empty" })
  @IsObject({ message: "orderUpload# should be a object" })
  @ApiPropertyOptional()
  orderUpload: OrderUploadDto;

  @ValidateNested({ each: true })
  @Type(() => MessagesDto)
  @IsNotEmpty({ message: "messages# should not be empty" })
  @IsObject({ message: "messages# should be a object" })
  @ApiPropertyOptional()
  messages: MessagesDto;
}

export class CreateGetConfigDto {
  @IsOptional()
  @IsArray({ message: "configDetails# should be array" })
  @IsNotEmpty({ message: "configDetails# should not be empty" })
  @ApiProperty({ name: "configDetails", type: [String], required: true })
  configDetails: string[];
}


export const ConfigUpdateSwaggerDto = {
  required: true,
  schema: {
    type: 'object',
    properties: {
      start_date: { type: 'Date', example: 'dd-mm-yyyy' },
      timeoutValue: { type: 'Number', example: 'Seconds' },
      sentry: {
        type: 'object',
        properties: {
          enabled: { type: 'Boolean', example: 'Boolean', default: true },
          apiDSN: { type: 'String', example: 'DSN Sentry Link for API' },
          androidDSN: { type: 'String', example: 'DSN Sentry Link for Android' },
          iosDSN: { type: 'String', example: 'DSN Sentry Link for iOS' },
        }
      },
      scrapingScriptVersion: {
        type: 'object',
        properties: {
          amazon: { type: 'String', example: 'Amazon Script version' },
          instacart: { type: 'String', example: 'Instacart Script version' },
          walmart: { type: 'String', example: 'Walmart Script version' },
          kroger: { type: 'String', example: 'Kroger Script version' },
        }
      },
      authScriptVersion: {
        type: 'object',
        properties: {
          amazon: { type: 'String', example: 'Amazon Auth Script version' },
          instacart: { type: 'String', example: 'Instacart Auth Script version' },
          walmart: { type: 'String', example: 'Walmart Auth Script version' },
          kroger: { type: 'String', example: 'Kroger Auth Script version' },
        }
      },
      scraping_interval: {
        type: 'object',
        properties: {
          value: { type: 'Number', example: '1' },
          type: { type: 'String', enum: ['day', 'week', 'month', 'year'], default: 'day' }
        }
      },
      intial_scrapping_type: { type: 'String', enum: ['report', 'html'], default: 'report' },
      scrapping_type: { type: 'String', enum: ['report', 'html'], default: 'report' },
      manualScrapeIncentiveDays: {
        type: 'string',
        isArray: true
      },
      manualScrapeIncentiveThreshold: { type: 'Number', example: 'In Days' },      
      commonMessages: {
        type: 'object',
        properties: {
          noInternetConnection: { type: 'String', example: 'Message for no internet' },
          invalidEmail: { type: 'String', example: 'Message for invalid email' }, 
          invalidPassword: { type: 'String', example: 'Message for invalid password' },
          unexpectedError: { type: 'String', example: 'Message for unexpected error' },
          unknownUrl: { type: 'String', example: 'message for unknown url' },
          loadingPageError: { type: 'String', example: 'Loading page error' },           
          defaultErrorMessage: { type: 'String', example: 'Default Erro Message' },
          serviceUnavailable: { type: 'String', example: 'Service unavailable message' },  
          defaultTimeoutErrorMessage: { type: 'String', example: 'Default Message for timeout' },
        }
      },
      platformSourceConfig: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platformSource: { type: 'String', example: 'Amazon' },
            enableScraping: { type: 'Boolean', example: 'Boolean', default: true },
            connections: {
              type: 'object',
              properties: {
                captchaRetries: { type: 'Number', example: 'Number of retries', default: 3 },
                cooloffPeriodCaptcha: { type: 'Number', example: 'Seconds', default: 300 },
                loginRetries: { type: 'Number', example: 'Number of retries', default: 3 },
                otherRetryCount: { type: 'Number', example: 'Number of retries', default: 3 }
              }
            },
            orderUpload: {
              type: 'object',
              properties: {
                isReportUploadEnabled: { type: 'Boolean', example: 'Boolean', default: true },
                scrappingDaysElapsed: { type: 'Number', example: 'Number of days', default: 10 },
                captchaRetries: { type: 'Number', example: 'Number of retries', default: 3 },
                cooloffPeriodCaptcha: { type: 'Number', example: 'Seconds', default: 300 },
                reportUploadRetries: { type: 'Number', example: 'Number of retries', default: 3 },
                htmlUploadRetries: { type: 'Number', example: 'Number of retries', default: 3 },
                orderDetailDelay: { type: 'Number', example: 'Seconds', default: 1 },
                orderUploadRetryCount: { type: 'Number', example: 'Number of retries', default: 1 },
                manualScrapeReportTimeout: { type: 'Number', example: 'Number of retries' },
                manualScrapeTimeout: { type: 'Number', example: 'Number of retries' }
              }
            },
            messages: {
              type: 'object',
              properties: {
                manualScrapeTimeoutMessage: { type: 'String', example: 'Message for manual scrape timeout' },
                manualScrapeNote: { type: 'String', example: 'Note for manual scrape success' }, 
                manualScrapeSuccess: { type: 'String', example: 'Message for manual scrape success' },
                manualNoNewOrdersMessage: { type: 'String', example: 'Message for manual scrape when no new orders' },
                manualNoNewOrdersNote: { type: 'String', example: 'Note for manual scrape when no new orders' },
                onlineScrapingSuccessNote: { type: 'String', example: 'Note for manual scrape success' },           
                onlineScrapingSuccessMessage: { type: 'String', example: 'Message for online scrape success' },
                onlineScrapingFailedMessage: { type: 'String', example: 'Note for online scrape failure' },  
                onlineScrapingTimeoutMessage: { type: 'String', example: 'Message for online scrape timeout' },   
                onlineZeroOrdersNote: { type: 'String', example: 'Note for online scrape when no orders' },
                onlineNoOrdersMessage: { type: 'String', example: 'Message for online scrape when no orders' },
              }
            },
            urls: {
              type: 'object',
              properties: {
                login: { type: 'String', example: 'Login page URL' },
                listing: { type: 'String', example: 'Listing page URL' },
                details: { type: 'String', example: 'Details page URL' },
                approvalUrl: { type: 'String', example: 'Approval page URL' },
                signInUrl: { type: 'String', example: 'Signin page URL' },
                generateReportUrl: { type: 'String', example: 'generate Report page URL' },
                skipUrl: { type: 'String', example: 'Skip page URL' },
                skipGenerateReportUrl: { type: 'String', example: 'Skip GenerateReportUrl page URL' },
                generateReportUrl2: { type: 'String', example: 'Generate ReportUrl2 page URL' },
                baseUrl: { type: 'String', example: 'Base page URL' },
                orderPageUrl: { type: 'String', example: 'Order page URL' },
                onboardingPageUrl: { type: 'String', example: 'onboarding page URL' },
                storePageUrl: { type: 'String', example: 'Store page URL' },
                createPasswordUrl: { type: 'String', example: 'Create Password page URL' },
                accountPageUrl: { type: 'String', example: 'Account page URL' },
                accountPage2Url: { type: 'String', example: 'Account page URL' },
                paymentPageUrl: { type: 'String', example: 'Payment page URL' },
              }
            },
            start_date: { type: 'Date', example: 'dd-mm-yyyy' },
            timeoutValue: { type: 'Number', example: 'Seconds' },
            scraping_interval: {
              type: 'object',
              properties: {
                value: { type: 'Number', example: '1' },
                type: { type: 'String', enum: ['day', 'week', 'month', 'year'], default: 'day' }
              }
            }
          }
        }
      }
    },
    required: []
  },
}