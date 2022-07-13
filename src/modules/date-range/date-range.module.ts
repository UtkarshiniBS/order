import { Module } from '@nestjs/common';
import { DateRangeV1Module } from './modules/v1/date-range-v1.module';
import { DateRangeV2Module } from './modules/v2/date-range-v2.module';

const modules = [
  DateRangeV1Module,
  DateRangeV2Module
]

@Module({
  imports: modules,
  controllers: [],
  providers: [],
  exports: modules
})
export class DateRangeModule {}
