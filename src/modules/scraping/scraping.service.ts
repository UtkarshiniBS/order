import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ENTITY } from 'src/app.models';
import { ConfigService } from 'src/common/service/config.service';
import { getConnection, Raw, Repository } from 'typeorm';
import { EventLogsDto } from './dto/eventLogs.dto';

export enum ScriptType {
  AUTH = 'auth',
  SCRAPE = 'scrape'
}
@Injectable({ scope: Scope.REQUEST })
export class ScrappingService {

  eventLogsRepository: Repository<any>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.eventLogsRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.EVENT_LOG, request.params));
  }

  async pushEvents(data: EventLogsDto): Promise<any> {
    return await this.eventLogsRepository.save(data);
  }

  async findAllEvents(data): Promise<any[]> {
    let where = {};
    if (data.platformId) {
      where['platformId'] = Raw(alias => `LOWER(${alias}) Like '%${data.platformId.toLowerCase()}%'`);
    }
    if (data.panelistId) {
      where['panelistId'] = data.panelistId;
    }
    return await this.eventLogsRepository.find({
      where,
      order: {
        id: 'DESC'
      },
      take: data.limit || 100
    });
  }
}
