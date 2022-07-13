import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { OrderHistoryModule } from 'src/modules/order_history/orderHistory.module';
import { DateRangeService } from '../../date-range.service';
import { DateRangeV2Controller } from './controller/date-range-v2.controller';
@Module({
  imports: [
    OrderHistoryModule,
  ],
  controllers: [DateRangeV2Controller],
  providers: [DateRangeService, ScraperConfigService],
  exports: []
})
export class DateRangeV2Module {}
