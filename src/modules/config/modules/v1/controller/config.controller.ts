import { BadRequestException, Controller, Get, HttpException, HttpStatus, Logger, Post, Put, UseGuards, Headers  } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Body, Param, Query, Res } from '@nestjs/common/decorators/http/route-params.decorator';
import { CommonModule } from '../../../../../common/module/common-module';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';
import { ConfigDto, ConfigUpdateSwaggerDto, CreateGetConfigDto } from '../../../dto/config.dto';
import { Response } from 'express';
import { RANGE_YEAR } from '../../../../date-range/date-range.service';
import { ScraperConfigService } from '../../../../../common/service/scraperConfig.service';
import { ApiKeyAuthGuard } from 'src/common/guard/api-key-auth.guard';
import { ConfigDbService } from '../../config-db.service';
import { ALLOWED_PLATFORMS } from 'src/app.models';
import {format} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz'

const path = require('path');
const fs = require('fs');
const dateFormat = require('dateformat');


@Controller('scraper_config')
@ApiTags('Scraper Configuration')
export class ConfigController {

  uploadDirectory = __dirname.replace(/src|modules|config|controller|v[0-50]/g, '').replace("dist", "");

  constructor(
    public scraperConfigService: ScraperConfigService,
    public configDbService: ConfigDbService,
  ) {
  }

  async bodyConfigFunction(object, childObject) {

    var newArray = [...object, ...childObject];
    var filtered = newArray.reduce((filtered, item) => {
      if (!filtered.some(filteredItem => filteredItem.platformSource == item.platformSource))
        filtered.push(item)
      return filtered
    }, [])
    return Object.entries(filtered).length !== 0 ? filtered : null;
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Updates general & platform specific configuration. General Configuration are used as a fallback mecahnism when platform specific configuration is not configured already",
    summary: 'API to update scrapping configuration'
  })
  @Put('update')
  @ApiBody(ConfigUpdateSwaggerDto)
  async updateGeneralConfig(@Body() body: ConfigDto, @Res() res: Response) {
    const config = await this.scraperConfigService.getScraperConfig();
    const bodyPlatformSourceConfigDetails = body['platformSourceConfig'];
    const platformSourceConfigDetails = config.platformSourceConfig;
    let configData = null;
    let updateConfigData = null;
    let updateConfig = null;
    let currentState = null;
    let firstObjectElement = bodyPlatformSourceConfigDetails;
    let secondObjectElement = platformSourceConfigDetails;
    let platformSourceList = [];
    let hasDuplicate = false;
    if (bodyPlatformSourceConfigDetails != undefined) {
      for (var i = 0; i < bodyPlatformSourceConfigDetails.length; i++) {
        platformSourceList.push(bodyPlatformSourceConfigDetails[i].platformSource);
      }
    }
    if (platformSourceList.length > 0) {
      hasDuplicate = platformSourceList.some((val, index) => platformSourceList.indexOf(val) !== index);
    }

    if (!hasDuplicate) {
      if (config && body.start_date) {
        config['start_date'] = body.start_date.toString();
      }
      if (config && body['scraping_interval']['value'] != null) {
        config['scraping_interval']['value'] = body['scraping_interval']['value'].toString();
      }
      if (config && body['scraping_interval']['type']) {
        config['scraping_interval']['type'] = body['scraping_interval']['type'].toString();
      }
      if (config && body.scrapping_type) {
        config['scrapping_type'] = body.scrapping_type.toString();
      }
      if (config && body.intial_scrapping_type) {
        config['intial_scrapping_type'] = body.intial_scrapping_type.toString();
      }

      if (config && body.sentry) {
        config['sentry'] = body.sentry;
      }

      if (config && body.manualScrapeIncentiveDays) {
        config['manualScrapeIncentiveDays'] = body.manualScrapeIncentiveDays;
      }

      if (config && body.manualScrapeIncentiveThreshold) {
        config['manualScrapeIncentiveThreshold'] = body.manualScrapeIncentiveThreshold;
      }

      if (config && body.timeoutValue) {
        config['timeoutValue'] = body.timeoutValue;
      }

      if (config && body.scrapingScriptVersion) {
        config['scrapingScriptVersion'] = body.scrapingScriptVersion;
      }

      if (config && body.authScriptVersion) {
        config['authScriptVersion'] = body.authScriptVersion;
      }

      if (config && body.commonMessages) {
        config['commonMessages'] = body.commonMessages;
      }

      if (bodyPlatformSourceConfigDetails && bodyPlatformSourceConfigDetails.length != undefined) {
        if (bodyPlatformSourceConfigDetails.length > 0 && platformSourceConfigDetails.length > 0) {
          switch (true) {
            case bodyPlatformSourceConfigDetails.length <= platformSourceConfigDetails.length:
              configData = bodyPlatformSourceConfigDetails;
              currentState = 'localConfig';
              break;
            default:
              configData = await this.bodyConfigFunction(firstObjectElement, secondObjectElement);
              currentState = 'bodyConfig';
              break;
          }
          if (configData && configData.length > platformSourceConfigDetails.length) {
            for (var i = 0; i <= configData.length - platformSourceConfigDetails.length; i++) {
              config.platformSourceConfig.push(this.getPlatformConfig());
            }
          } else if (currentState == 'localConfig') {
            config['platformSourceConfig'] = [];
            for (var i = 0; i < configData.length; i++) {
              config.platformSourceConfig.push(this.getPlatformConfig());
            }
          }
        }
      }
      if (configData != null && configData.length > 0) {
        for (var i = 0; i < configData.length; i++) {
          updateConfigData = configData[i];
          if (updateConfigData != null) {
            updateConfig = updateConfigData;

            // set platform source name
            if (config && updateConfig['platformSource']) {
              if (!config['platformSourceConfig'][i]) {
                config['platformSourceConfig'][i] = this.getPlatformConfig();
              }
              config['platformSourceConfig'][i]['platformSource'] = updateConfig['platformSource'].toString();
            }

            // set platform enable config
            if (config) {
              config['platformSourceConfig'][i]['enableScraping'] = updateConfig['enableScraping'];
            }

            if (config && updateConfig['connections']) {
              config['platformSourceConfig'][i]['connections'] = updateConfig['connections'];
            }

            if (config && updateConfig['orderUpload']) {
              config['platformSourceConfig'][i]['orderUpload'] = updateConfig['orderUpload'];
            }

            if (config && updateConfig['messages']) {
              config['platformSourceConfig'][i]['messages'] = updateConfig['messages'];
            }

            // set platform source urls
            if (config && updateConfig['urls']) {
              config['platformSourceConfig'][i]['urls'] = updateConfig['urls'];
            }

            // set platform source startDate
            if (config && updateConfig['start_date']) {
              config['platformSourceConfig'][i]['start_date'] = updateConfig['start_date'].toString();
            } else {
              config['platformSourceConfig'][i]['start_date'] = body.start_date.toString();
            }

            // set platform source timeoutValue
            if (config && updateConfig['start_date']) {
              config['platformSourceConfig'][i]['timeoutValue'] = updateConfig['timeoutValue'];
            } else {
              config['platformSourceConfig'][i]['timeoutValue'] = body.timeoutValue;
            }

            // set platform source interval value and type
            if (config && updateConfig['scraping_interval']) {
              // set platform source intervalPeriod
              if (config && updateConfig['scraping_interval']['value'] != null) {
                config['platformSourceConfig'][i]['scraping_interval']['value'] = updateConfig['scraping_interval']['value'].toString();
              } else if (config && body['scraping_interval']['value'] != null) {
                config['platformSourceConfig'][i]['scraping_interval']['value'] = body['scraping_interval']['value'].toString();
              }
            } else {
              config['platformSourceConfig'][i]['scraping_interval']['value'] = body['scraping_interval']['value'].toString();
            }

            if (config && updateConfig['scraping_interval']) {
              // set platform source intervalType
              if (config && updateConfig['scraping_interval']['type']) {
                config['platformSourceConfig'][i]['scraping_interval']['type'] = updateConfig['scraping_interval']['type'].toString();
              } else if (config && body['scraping_interval']['type'] != null) {
                config['platformSourceConfig'][i]['scraping_interval']['type'] = body['scraping_interval']['type'].toString();
              }
            } else {
              config['platformSourceConfig'][i]['scraping_interval']['type'] = body['scraping_interval']['type'].toString();
            }
          }
        }
        if (config) {
          // set file config
          const configData = await this.configDbService.setDBConfig(config);
          res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "Scraper configuration updated!", configData));
        }
      } else if (bodyPlatformSourceConfigDetails == undefined && body) {
        config.platformSourceConfig = [];
        config.platformSourceConfig.push(this.getPlatformConfig({
          'scrappingType': body['scraping_interval']['value'].toString(),
          'scrappingValue': body['scraping_interval']['type'].toString(),
          'timeoutValue': body.timeoutValue,
          'start_date': body.start_date.toString()
        }));
        if (config) {
          // set file config
          const configData = await this.configDbService.setDBConfig(config);
          res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "Scraper configuration updated!", configData));
        }
      }
      else {
        throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Could not update request data, invalid JSON', null), HttpStatus.BAD_REQUEST);
        // res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Could not update request data, invalid JSON', null));
      }
    } else {
      throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Duplicate request data', null), HttpStatus.BAD_REQUEST);
      // res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Duplicate request data', null));
    }
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches scrapping configuration based on provided platformSources. If a platformSource is not configured already, it falls back to global configuration and provides them in the result",
    summary: 'API to fetch scrapping configuration for the list of platformSources'
  })
  @Post('get_config')
  async getConfigDetails(@Body() body: CreateGetConfigDto, @Res() response: Response) {
    if (!body.configDetails.length) {
      return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Invalid request!', null);
    }
    const today = new Date();
    today.setFullYear(today.getFullYear() - RANGE_YEAR);
    let configData: any = await this.configDbService.getDBConfig();
    if (!configData) {
      // response.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, 'Config Fetched', config));
      configData = this.getConfigData(today);
      await this.configDbService.setDBConfig(configData);
    }
    const configDetails = body.configDetails ? body.configDetails : null;
    const msg = configData ? 'Scraper configuration fetched successfully!' : 'No Scraper configuration found!';

    if (configData != null) {
      let responseData = {
        sentry: configData.sentry,
        commonMessages: configData.commonMessages,
        configurations: []
      };
      if (configDetails.length > 0 && configDetails[0] != 'string') {
        let websiteName = '';
        let platformSourceData = configData['platformSourceConfig'];
        for (var configIndex = 0; configIndex < configDetails.length; configIndex++) {
          websiteName = configDetails[configIndex].toLowerCase();
          for (var platformSourceIndex = 0; platformSourceIndex < platformSourceData.length; platformSourceIndex++) {
            if (websiteName == platformSourceData[platformSourceIndex].platformSource.toLowerCase()) {
              const configResponse = {
                ...platformSourceData[platformSourceIndex],
                scraping_interval: {
                  value: platformSourceData[platformSourceIndex]['scraping_interval']['value'] ? platformSourceData[platformSourceIndex]['scraping_interval']['value'] : configData['scraping_interval']['value'],
                  type: platformSourceData[platformSourceIndex]['scraping_interval']['type'] ? platformSourceData[platformSourceIndex]['scraping_interval']['type'] : configData['scraping_interval']['type']
                },
                platformSource: platformSourceData[platformSourceIndex]['platformSource'],
                enableScraping: platformSourceData[platformSourceIndex]['enableScraping'],
                start_date: platformSourceData[platformSourceIndex]['start_date'].toString() != 'dd-mm-yyyy' ? platformSourceData[platformSourceIndex]['start_date'] : configData['start_date'],
                timeoutValue: platformSourceData[platformSourceIndex]['timeoutValue'].toString() != 'seconds' ? platformSourceData[platformSourceIndex]['timeoutValue'] : configData['timeoutValue'],
                urls: platformSourceData[platformSourceIndex]['urls'],
              };
              responseData.configurations.push(configResponse);
            }
          }
        }
      } else {
        responseData.configurations.push({
          sentry: configData.sentry,
          platformSource: null,
          scraping_interval: configData['scraping_interval'],
          start_date: configData['start_date'],
          intial_scrapping_type: configData['intial_scrapping_type'],
          scrapping_type: configData['scrapping_type'],
        })
      }
      response.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, msg, responseData));
    }

    // response.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatResponse(HttpStatus.BAD_REQUEST, e, null));
  }

  //@UseGuards(DynamicAuthGuard)
  @UseGuards(ApiKeyAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches default global configuration from `scrapperConfig` file in the file system. If file not already exists, this API would create a default configuration file",
    summary: 'API to fetch global configuration'
  })
  @Get()
  async getGeneralConfig(@Res() res: Response) {
    const filePath = path.join(this.uploadDirectory, 'scraperConfig.json');
    const today = new Date();
    today.setFullYear(today.getFullYear() - RANGE_YEAR);
    const configData = await this.configDbService.getDBConfig();
    // configData from DB
    const msg = configData ? 'Scraper configuration fetched successfully!' : 'No Scraper configuration found!';
    res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, msg, configData));
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Determines whether to show this flag for all retailers based on day user requests",
    summary: 'API to show $$ flag in the APP using `manualScrapeIncentiveDays` configuration'
  })
  @ApiQuery({ name: 'timezone', type: 'String', required: false })
  @ApiQuery({ name: 'sessionStartTime', type: 'String', required: false })
  @Get('show_incentive_flag_all_retailers')
  async isManualScrapeIncentiveActiveAllRetailers(@Query('timezone') timezone: string, @Query('sessionStartTime') sessionStartTime: string,  @Res() res: Response, @Headers() headers: Record < string, string > ) {
    if(sessionStartTime && !/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]/.test(sessionStartTime)) {
      res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'sessionStartTime should be in this format yyyy-MM-dd HH:mm:ss', null));
    }
    let configData: any = await this.configDbService.getDBConfig();
    const days = configData.manualScrapeIncentiveDays;
    const thresholdDays = configData.manualScrapeIncentiveThreshold;
    const panelistId = headers['panelist_id'];
    if(!(days && thresholdDays)) {
      res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Manual scrape incentive days or threshold day is not configured', null));
    }
    if(!panelistId) {
      res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'No panelist_id in headers', null));
    }
    const date = new Date();
    const dateC = timezone ? utcToZonedTime(date, timezone) : date;
    const day = format(this.dateIsValid(dateC) ? dateC : date, 'EEEE');
    let isIncentiveDays = days.includes(day);
    const response = {
      currentDay: day,
      configuredDays: days
    } 
    // Get connection status of all the platfoms
    const connectedStatus = await this.configDbService.getConnectionStatus(panelistId);
    const { incentiveOrderAmazon, incentiveOrderInstacart, incentiveOrderWalmart } =  await this.configDbService.checkForIncentiveScrapingCompletion(panelistId, thresholdDays, connectedStatus);
    const orderCount: any =  await this.configDbService.getLastWeekOrders(panelistId, thresholdDays, sessionStartTime, connectedStatus);
    // Additional check for an issue wheere order could be scraped beyond 7 days during incentive period
    const { incentiveOrderAmazonCount, incentiveOrderInstacartCount, incentiveOrderWalmartCount }: any =  await this.configDbService.getIncentizedOrderCount(panelistId, days, connectedStatus);
    const isIncentiveCompleted = incentiveOrderAmazon || incentiveOrderInstacart || incentiveOrderWalmart;
    const hasLastWeekOrders = orderCount.amazon || orderCount.instacart || orderCount.walmart;
    const hasOrdersForCurrentIncentivePeriod = incentiveOrderAmazonCount || incentiveOrderInstacartCount || incentiveOrderWalmartCount;
    let isFlagEnabled = (isIncentiveDays && !isIncentiveCompleted) 
        || ( (isIncentiveDays && isIncentiveCompleted && !hasLastWeekOrders) && (isIncentiveDays && isIncentiveCompleted && !hasOrdersForCurrentIncentivePeriod) )
    response['currentIncentiveOrders'] = {
      [ALLOWED_PLATFORMS.AMAZON]: incentiveOrderAmazonCount,
      [ALLOWED_PLATFORMS.INSTACART]: incentiveOrderInstacartCount,
      [ALLOWED_PLATFORMS.WALMART]: incentiveOrderWalmartCount,
    }
    response['lastIncentiveScrapeDate'] = {
      [ALLOWED_PLATFORMS.AMAZON]: incentiveOrderAmazon && incentiveOrderAmazon.scrapingSessionStartedAt || null,
      [ALLOWED_PLATFORMS.INSTACART]: incentiveOrderInstacart && incentiveOrderInstacart.scrapingSessionStartedAt || null,
      [ALLOWED_PLATFORMS.WALMART]: incentiveOrderWalmart && incentiveOrderWalmart.scrapingSessionStartedAt || null,
    }
    response['lastWeekOrderCount'] = {
      [ALLOWED_PLATFORMS.AMAZON]: orderCount.amazon,
      [ALLOWED_PLATFORMS.INSTACART]: orderCount.instacart,
      [ALLOWED_PLATFORMS.WALMART]: orderCount.walmart
    }
    response['isFlagEnabled'] = isFlagEnabled;
    response['connectedStatus'] = connectedStatus;
    res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "Flag is returned", response));
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Determines whether to show this flag for Amazon based on day user requests",
    summary: 'API to show $$ flag in the APP using `manualScrapeIncentiveDays` configuration'
  })
  @ApiQuery({ name: 'timezone', type: 'String', required: false })
  @Get('show_incentive_flag')
  async isManualScrapeIncentiveActive(@Query('timezone') timezone: string, @Res() res: Response, @Headers() headers: Record < string, string > ) {
    let configData: any = await this.configDbService.getDBConfig();
    const days = configData.manualScrapeIncentiveDays;
    const thresholdDays = configData.manualScrapeIncentiveThreshold;
    const panelistId = headers['panelist_id'];
    if(!(days && thresholdDays)) {
      res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Manual scrape incentive days or threshold day is not configured', null));
    }
    if(!panelistId) {
      res.status(HttpStatus.BAD_REQUEST).send(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'No panelist_id in headers', null));
    }
    const date = new Date();
    const dateC = timezone ? utcToZonedTime(date, timezone) : date;
    const day = format(this.dateIsValid(dateC) ? dateC : date, 'EEEE');
    let isFlagShown = days.includes(day);
    const isIncentiveScrapingSuccess =  await this.configDbService.checkForAmazonIncentiveScrapingCompletion(panelistId, thresholdDays);
    const response = {
      isFlagEnabled: isFlagShown && !isIncentiveScrapingSuccess,
      currentDay: day,
      configuredDays: days
    } 
    if(isIncentiveScrapingSuccess) {
      response['lastIncentiveScrapeDate'] = isIncentiveScrapingSuccess.scrapingSessionStartedAt
    }
    res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "Flag is returned", response));
  }


  dateIsValid(date) {
    return !Number.isNaN(new Date(date).getTime());
  }

  getConfigData(date) {
    return {
      "scraping_interval": {
        "value": "0",
        "type": "day"
      },
      "start_date": dateFormat(date, "dd-mm-yyyy"),
      "intial_scrapping_type": "",
      "scrapping_type": "",
      "platformSourceConfig": [{
        'platformSource': 'amazon',
        'enableScraping': true,
        "connections": {
          "captchaRetries": "Number of retries",
          "cooloffPeriodCaptcha": "Seconds",
          "loginRetries": "Seconds",

        },
        "orderUpload": {
          "scrappingDaysElapsed": "Number of days",
          "captchaRetries": "Number of retries",
          "cooloffPeriodCaptcha": "Seconds",
          "reportUploadRetries": "Number of retries",
          "htmlUploadRetries": "Number of retries"
        },
        "urls": {
          "login": "Login page URL",
          "listing": "Order Listing page URL",
          "details": "Order Details page URL",
        },
        "scraping_interval": {
          "value": "0",
          "type": "day"
        },
        "start_date": dateFormat(date, "dd-mm-yyyy"),
        "timeoutValue": "seconds",
      }]
    }
  }

  getPlatformConfig(obj?: any) {
    return {
      "platformSource": obj?.platformSource ? obj?.platformSource : "Name",
      "enableScraping": "Boolean",
      "urls": {
        "login": "Login page URL",
        "listing": "Order Listing page URL",
        "details": "Order Details page URL",
      },
      "connections": {
        "captchaRetries": "Number of retries",
        "cooloffPeriodCaptcha": "Seconds",
        "loginRetries": "Seconds"
      },
      "orderUpload": {
        "scrappingDaysElapsed": "Number of days",
        "captchaRetries": "Number of retries",
        "cooloffPeriodCaptcha": "Seconds",
        "reportUploadRetries": "Number of retries",
        "htmlUploadRetries": "Number of retries"
      },
      "scraping_interval": {
        "value": obj?.scrappingValue ? obj?.scrappingValue : "0",
        "type": obj?.scrappingType ? obj?.scrappingType : "day"
      },
      "start_date": obj?.start_date ? dateFormat(obj?.start_date, "dd-mm-yyyy") : "dd-mm-yyyy",
      "timeoutValue": obj?.timeoutValue ? obj?.timeoutValue : "seconds"
    }
  }
}