import { Module } from '@nestjs/common';
import { OrderHistoryV1Module } from './modules/v1/orderHistoryV1.module';
import { OrderHistoryV2Module } from './modules/v2/orderHistoryV2.module';

const modules = [
  OrderHistoryV1Module,
  OrderHistoryV2Module
]

@Module({
  imports: modules,
  controllers: [],
  providers: [],
  exports: modules,
})
export class OrderHistoryModule {}
