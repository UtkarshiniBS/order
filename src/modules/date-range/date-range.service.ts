import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { getConnection, Raw, Repository, Not } from 'typeorm';
import { CreateDateRangeV1Dto } from './dto/create-date-range-v1.dto';
import { ScraperConfigService } from '../../common/service/scraperConfig.service';
import { CommonModule } from '../../common/module/common-module';
import { CreateDateRangeV2Dto } from './dto/create-date-range-v2.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ConfigService } from 'src/common/service/config.service';
import { ALLOWED_PLATFORMS, ENTITY } from 'src/app.models';
import { LogsSectionType, LogsStatusType } from '../scraping/dto/eventLogs.dto';
import { ScrappingType } from '../config/dto/config.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderHistoryEntityType } from 'src/common/entityTypes/orderHistoryEntity.type';
const dateFormat = require('dateformat');

export const RANGE_YEAR = 2;

@Injectable({ scope: Scope.REQUEST })
export class DateRangeService {
  
  repository: Repository<any>;
  eventLogsRepository: Repository<any>;

  constructor(
    @Inject('ScraperConfigService')
    private scraperConfigService: ScraperConfigService,
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
     this.repository = getConnection().getRepository(this.configService.getRepository(ENTITY.ORDER_HISTORY, request.params));
     this.eventLogsRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.EVENT_LOG, request.params));
  }

  async frameDateRange(createDateRangeDto: CreateDateRangeV1Dto |  CreateDateRangeV2Dto | any, platformSource?) {
    const platformId = createDateRangeDto.platformId ? createDateRangeDto.platformId : createDateRangeDto.amazonId;
    const orderHistory = await this.repository.findOne({
      where: [{ panelistId: createDateRangeDto.panelistId, platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`) }],
      order: { toDate: 'DESC', id: 'DESC' }
    });
    let [date, subDate] = [new Date(), new Date()];
    new Date(subDate.setFullYear(subDate.getFullYear() - RANGE_YEAR));
    let lastScrapedDate = orderHistory && orderHistory.toDate ? orderHistory.toDate : subDate;
    let enableScraping = false;
    let nextScrapDate = null;
    const platform = platformSource ? platformSource.toLowerCase() : ALLOWED_PLATFORMS.AMAZON;
    const config = await this.scraperConfigService.getScraperConfig(platform);
    if (config) {
      const lastToDate = orderHistory && orderHistory.toDate ? orderHistory.toDate : null;
      const checkConfig = this.scraperConfigService.checkScrapEable(config, lastToDate);
      enableScraping = checkConfig.enableScrap;
      nextScrapDate = checkConfig.nextScrapDate;
      if (!orderHistory) {
        enableScraping = true; //enable for fist time scrapping
        lastScrapedDate = config.start_date ? CommonModule.formatDate(config.start_date) : subDate;
        Logger.log('First time scraper: ' + dateFormat(lastScrapedDate, "mm-dd-yyyy"));
      }
    }
    if(!config.enableScraping) {
      enableScraping = false;
    }
    if(createDateRangeDto.forceScrape) {
      enableScraping = true;
    }
    // const scrappingType = orderHistory ? 'html' : 'report';
    const { scrappingType, showNotification } = await this.scraperConfigService.getScrappingType(orderHistory, createDateRangeDto, config, platform);
    if (this.scraperConfigService.getDateWithoutTime(lastScrapedDate).toDateString() == this.scraperConfigService.getDateWithoutTime(date).toDateString()) {
      if(createDateRangeDto.forceScrape) {
        lastScrapedDate.setDate(lastScrapedDate.getDate());
      } else {
        lastScrapedDate.setDate(lastScrapedDate.getDate() - 1);
      }
    }
    return { fromDate: dateFormat(lastScrapedDate, "dd-mm-yyyy"), toDate: dateFormat(date, "dd-mm-yyyy"), enableScraping, nextScrapDate, scrappingType: scrappingType, showNotification: showNotification };
  }
}
