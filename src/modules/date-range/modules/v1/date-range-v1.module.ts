import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { OrderHistoryModule } from 'src/modules/order_history/orderHistory.module';
import { AmazonLogsEntity } from 'src/modules/scraping/entity/amazon-logs.entity';
import { DateRangeService } from '../../date-range.service';
import { DateRangeV1Controller } from './controller/date-range-v1.controller';
import { DateRangeController } from './controller/date-range.controller';
@Module({
  imports: [
    OrderHistoryModule,
  ],
  controllers: [DateRangeController, DateRangeV1Controller],
  providers: [DateRangeService, ScraperConfigService],
  exports: []
})
export class DateRangeV1Module {}
