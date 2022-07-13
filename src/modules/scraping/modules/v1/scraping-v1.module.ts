import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmazonLogsEntity } from '../../entity/amazon-logs.entity';
import { ScrappingService } from '../../scraping.service';
import { ScrappingV1Controller } from './controller/scraping-v1.controller';
import { ScrappingController } from './controller/scraping.controller';

@Module({
  imports: [],
  controllers: [ScrappingController, ScrappingV1Controller],
  providers: [ScrappingService],
  exports: [
    ScrappingService
  ]
})
export class ScrappingV1Module {}
