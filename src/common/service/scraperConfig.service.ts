import {
  HttpException,
  HttpService,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CreateDateRangeV1Dto } from 'src/modules/date-range/dto/create-date-range-v1.dto';
import { getConnection, In, Not, Raw, Repository } from 'typeorm';
import { RANGE_YEAR } from '../../modules/date-range/date-range.service';
import { CommonModule } from '../module/common-module';
import { ConfigService } from './config.service';
import { Request } from 'express';
import { ALLOWED_PLATFORMS, ALL_PLATFORMS, ENTITY } from 'src/app.models';
import { ScrappingType } from 'src/modules/config/dto/config.dto';
import { CreateDateRangeV2Dto } from 'src/modules/date-range/dto/create-date-range-v2.dto';
import {
  LogsSectionType,
  LogsStatusType,
  ScrapingContext,
} from 'src/modules/scraping/dto/eventLogs.dto';
import { OrderHistoryEntityType } from '../entityTypes/orderHistoryEntity.type';
const dateFormat = require('dateformat');
const path = require('path');
const fs = require('fs');

@Injectable({ scope: Scope.REQUEST })
export class ScraperConfigService {
  uploadDirectory = __dirname
    .replace(/src|common|service|/g, '')
    .replace('dist', '');
  repository: Repository<any>;
  eventLogsRepository: Repository<any>;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.repository = getConnection().getRepository(
      this.configService.getRepository(ENTITY.ORDER_HISTORY, request.params),
    );
    this.eventLogsRepository = getConnection().getRepository(
      this.configService.getRepository(ENTITY.EVENT_LOG, request.params),
    );
  }

  async checkScaperInterval(
    panelistId: string,
    platformId: string,
    platformSource: string,
  ) {
    let enableScraping = false;
    const orderHistory = await this.repository.findOne({
      where: [
        {
          panelistId,
          platformId: Raw(
            alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`,
          ),
        },
      ],
      order: { id: 'DESC' },
    });
    let [subDate] = [new Date(), new Date()];
    new Date(subDate.setFullYear(subDate.getFullYear() - RANGE_YEAR));
    const config = await this.getScraperConfig(platformSource);
    let nextScrapDate = '';
    if (config) {
      const lastToDate =
        orderHistory && orderHistory.toDate ? orderHistory.toDate : null;
      const checkConfig = this.checkScrapEable(config, lastToDate);
      enableScraping = checkConfig.enableScrap;
      nextScrapDate = checkConfig.nextScrapDate;
    }
    if (!orderHistory) {
      enableScraping = true; //enable for fist time scrapping
    }
    return { enableScraping, nextScrapDate };
  }

  async validateScraperConfig(data: CreateDateRangeV1Dto) {
    const orderHistory = await this.repository.findOne({
      where: [
        {
          panelistId: data.panelistId,
          amazonId: Raw(
            alias => `LOWER(${alias}) Like '%${data.amazonId.toLowerCase()}%'`,
          ),
        },
      ],
      order: { id: 'DESC' },
    });
    let [date, subDate] = [new Date(), new Date()];
    new Date(subDate.setFullYear(subDate.getFullYear() - RANGE_YEAR));
    let lastScrapedDate =
      orderHistory && orderHistory.toDate ? orderHistory.toDate : subDate;
    let enableScraping = false;
    let nextScrapDate = '';
    const config = await this.getScraperConfig();
    if (config) {
      const lastToDate =
        orderHistory && orderHistory.toDate ? orderHistory.toDate : null;
      const checkConfig = this.checkScrapEable(config, lastToDate);
      enableScraping = checkConfig.enableScrap;
      nextScrapDate = checkConfig.nextScrapDate;
      if (!orderHistory) {
        enableScraping = true; //enable for fist time scrapping
        lastScrapedDate = config.start_date
          ? CommonModule.formatDate(config.start_date)
          : subDate;
      }
    }
    if (lastScrapedDate.toDateString() == date.toDateString()) {
      lastScrapedDate.setDate(orderHistory.toDate.getDate() - 1);
    }
    return {
      fromDate: dateFormat(lastScrapedDate, 'dd-mm-yyyy'),
      toDate: dateFormat(date, 'dd-mm-yyyy'),
      enableScraping,
      nextScrapDate,
    };
  }

  async getScraperConfig(platformSource?): Promise<any> {
    const configData: any = await this.configService.scrapingConfig();
    if (platformSource) {
      let returnData = configData.platformSourceConfig.filter(source => {
        if (source.platformSource.toLowerCase() === platformSource) {
          return true;
        }
      });
      returnData = returnData.length ? returnData[0] : configData;
      returnData['intial_scrapping_type'] = configData['intial_scrapping_type'];
      returnData['scrapping_type'] = configData['scrapping_type'];
      return returnData;
    } else {
      return configData;
    }
  }

  checkScrapEable(config, lastScrapedDate) {
    let scrapingInterval =
      config.scraping_interval && config.scraping_interval.value
        ? config.scraping_interval.value
        : '0';
    let intervalType =
      config.scraping_interval && config.scraping_interval.type
        ? config.scraping_interval.type
        : null;
    let intervalDate =
      lastScrapedDate != null
        ? new Date(lastScrapedDate)
        : new Date(CommonModule.formatDate(config.start_date));
    let today = new Date();
    switch (intervalType) {
      case 'day':
        intervalDate.setDate(
          intervalDate.getDate() + parseInt(scrapingInterval),
        );
        break;
      case 'week':
        intervalDate.setDate(
          intervalDate.getDate() + parseInt(scrapingInterval) * parseInt('7'),
        );
        break;
      case 'month':
        intervalDate.setMonth(
          intervalDate.getMonth() + parseInt(scrapingInterval),
        );
        break;
      case 'year':
        intervalDate.setFullYear(
          intervalDate.getFullYear() + parseInt(scrapingInterval),
        );
        break;
    }
    Logger.log('Scrap Start Date: ' + config.start_date);
    Logger.log('Scrap Interval Value: ' + scrapingInterval);
    Logger.log('Scrap Interval Type: ' + intervalType);
    Logger.log(
      'Last Scraped Date: ' + dateFormat(lastScrapedDate, 'mm-dd-yyyy'),
    );
    Logger.log('Next Scrap Date: ' + dateFormat(intervalDate, 'mm-dd-yyyy'));
    Logger.log('Today: ' + dateFormat(today, 'mm-dd-yyyy'));
    Logger.log(
      'Enable Scrap: ' +
        (this.getDateWithoutTime(today) >=
          this.getDateWithoutTime(intervalDate)),
    );
    const enableScrap =
      scrapingInterval > 0
        ? this.getDateWithoutTime(today) >=
          this.getDateWithoutTime(intervalDate)
        : true;
    return {
      enableScrap: enableScrap,
      lastScrapedDate: dateFormat(lastScrapedDate, 'dd-mm-yyyy'),
      nextScrapDate: dateFormat(intervalDate, 'dd-mm-yyyy'),
      intervalValue: scrapingInterval,
      scrapType: intervalType,
      scrapStartDate: config.start_date,
    };
  }

  getDateWithoutTime(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async getScrappingType(
    orderHistory: OrderHistoryEntityType,
    data: CreateDateRangeV1Dto | CreateDateRangeV2Dto | any,
    config: any,
    platformSource?: ALLOWED_PLATFORMS,
  ) {
    let scrappingType = ScrappingType.REPORT;
    let showNotification = false;
    const platformId = data.platformId ? data.platformId : data.amazonId;
    const daysDifference = function(startDate, endDate) {
      const oneDay = 24 * 60 * 60 * 1000;
      return Math.round(Math.abs((endDate - startDate) / oneDay));
    };
    let eventLogsRepository = this.eventLogsRepository;
    if (platformSource) {
      eventLogsRepository = getConnection().getRepository(
        this.configService.getRepository(ENTITY.EVENT_LOG, {
          platformSource: platformSource,
        }),
      );
    }
    const getReportFailureCount = async () => {
      return await eventLogsRepository.count({
        where: [
          {
            panelistId: data.panelistId,
            platformId: Raw(
              alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`,
            ),
            scrapingContext: ScrapingContext.FOREGROUND,
            section: LogsSectionType.CONNECTION,
            scrappingType: ScrappingType.REPORT,
            type: Not(In(['notify', 'authenticaion'])),
            status: LogsStatusType.FAILURE,
          },
        ],
      });
    };
    const getLogsData = async limit => {
      return await eventLogsRepository.find({
        where: [
          {
            panelistId: data.panelistId,
            platformId: Raw(
              alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`,
            ),
            section: LogsSectionType.ORDER_UPLOAD,
            type: Not('notify'),
          },
          {
            panelistId: data.panelistId,
            platformId: Raw(
              alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`,
            ),
            scrapingContext: ScrapingContext.FOREGROUND,
            section: LogsSectionType.CONNECTION,
            scrappingType: ScrappingType.REPORT,
            type: Not(In(['notify', 'authenticaion'])),
          },
        ],
        order: { id: 'DESC' },
        take: limit,
      });
    };
    // Configuraions
    const isReportUploadEnabled = config.orderUpload.isReportUploadEnabled;
    const scrappingDaysElapsed = config.orderUpload.scrappingDaysElapsed;
    const reportRetries = config.orderUpload.reportUploadRetries;
    const htmlRetries = config.orderUpload.htmlUploadRetries;
    const captchaRetries = config.orderUpload.captchaRetries;
    // logic starts
    if (platformSource === ALLOWED_PLATFORMS.AMAZON && isReportUploadEnabled) {
      if (
        !orderHistory ||
        daysDifference(orderHistory.toDate, new Date()) > scrappingDaysElapsed
      ) {
        // Report Flow
        const logs = await getLogsData(reportRetries);
        if (logs.length <= 0 || logs.length != reportRetries) {
          scrappingType = ScrappingType.REPORT;
        } else {
          const hasFailure = logs.every(log => {
            return (
              log.scrappingType == ScrappingType.REPORT &&
              log.status == LogsStatusType.FAILURE
            );
          });
          if (hasFailure) {
            // captcha flow
            const hasCaptchaFailure = logs.slice(0, captchaRetries).length
              ? logs.slice(0, captchaRetries).every(log => {
                  return log.type.toLowerCase() == 'captcha';
                })
              : false;
            if (hasCaptchaFailure) {
              scrappingType = ScrappingType.REPORT;
              showNotification = true;
            } else {
              scrappingType = ScrappingType.HTML;
            }
          } else {
            // check for total failure count of report
            const failCount = await getReportFailureCount();
            if (failCount >= reportRetries) {
              scrappingType = ScrappingType.HTML;
            } else {
              scrappingType = ScrappingType.REPORT;
            }
          }
        }
      } else {
        // HTML flow
        const logs = await getLogsData(htmlRetries);
        if (logs.length <= 0 || logs.length != htmlRetries) {
          scrappingType = ScrappingType.HTML;
        } else {
          const hasFailure = logs.every(log => {
            return (
              log.scrappingType == ScrappingType.HTML &&
              log.status == LogsStatusType.FAILURE
            );
          });
          if (hasFailure) {
            // captcha flow
            const hasCaptchaFailure = logs.slice(0, captchaRetries).length
              ? logs.slice(0, captchaRetries).every(log => {
                  return log.type.toLowerCase() == 'captcha';
                })
              : false;
            if (hasCaptchaFailure) {
              scrappingType = ScrappingType.HTML;
              showNotification = true;
            } else {
              scrappingType = ScrappingType.REPORT;
            }
          } else {
            scrappingType = ScrappingType.HTML;
          }
        }
      }
    } else {
      scrappingType = ScrappingType.HTML;
      const logs = await getLogsData(htmlRetries);
      if (logs.length <= 0 || logs.length != htmlRetries) {
        scrappingType = ScrappingType.HTML;
      } else {
        const hasFailure = logs.every(log => {
          return (
            log.scrappingType == ScrappingType.HTML &&
            log.status == LogsStatusType.FAILURE
          );
        });
        if (hasFailure) {
          // captcha flow
          const hasCaptchaFailure = logs.slice(0, captchaRetries).length
            ? logs.slice(0, captchaRetries).every(log => {
                return log.type.toLowerCase() == 'captcha';
              })
            : false;
          if (hasCaptchaFailure) {
            scrappingType = ScrappingType.HTML;
            showNotification = true;
          } else {
            scrappingType = ScrappingType.HTML;
          }
        } else {
          scrappingType = ScrappingType.HTML;
        }
      }
    }
    console.log('Scrapinnng types ', scrappingType, showNotification);
    return { scrappingType, showNotification };
  }

  async getScrapingType(
    panelistId: string,
    platformId: string,
    platformSource?: string,
  ) {
    platformSource = platformSource
      ? platformSource.toLowerCase()
      : ALLOWED_PLATFORMS.AMAZON;
    const config = await this.getScraperConfig(platformSource);
    this.repository = getConnection().getRepository(
      this.configService.getRepository(ENTITY.ORDER_HISTORY, {
        platformSource: platformSource,
      }),
    );
    const orderHistory = await this.repository.findOne({
      where: [
        {
          panelistId: panelistId,
          platformId: Raw(
            alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`,
          ),
        },
      ],
      order: { id: 'DESC' },
    });
    const data = { panelistId: panelistId, platformId: platformId };
    return await this.getScrappingType(
      orderHistory,
      data,
      config,
      platformSource as ALLOWED_PLATFORMS,
    );
  }

  async tagAPI(panelistId, tagName) {
    let url = `${this.configService.get('TAG_URL')}/${panelistId}/tag?tagName=${tagName}`;
    try {
      const res = await this.httpService
        .post(url, {}, {
          headers: {
            gtokenString: panelistId,
            // 'Content-Type': 'text/plain',
          },
        })
        .toPromise();
      if (res.data) {
        if(res.data.status === 'Success') {
          console.log('Status is success');
        } else {
          console.log('Status is failed ', res.data);
          // throw 'Failed to update tag';
        }
      }
    } catch (e) {
      console.log('Tag Exception ', e);
    }
  }
}
