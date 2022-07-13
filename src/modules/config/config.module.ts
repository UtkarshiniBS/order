import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmazonOrdersEntity } from '../order_history/entity/amazonOrder.entity';
import { AmazonOrderHistoryEntity } from '../order_history/entity/amazonOrderHistory.entity';
import { InstacartOrdersEntity } from '../order_history/entity/instacartOrder.entity';
import { InstacartOrderHistoryEntity } from '../order_history/entity/instacartOrderHistory.entity';
import { KrogerOrderHistoryEntity } from '../order_history/entity/krogerOrderHistory.entity';
import { WalmartOrdersEntity } from '../order_history/entity/walmartOrder.entity';
import { WalmartOrderHistoryEntity } from '../order_history/entity/walmartOrderHistory.entity';
import { ConfigEntity } from './entiry/config.entity';
import { ConfigDbService } from './modules/config-db.service';
import { ConfigV1Module } from './modules/v1/config-v1.module';
import { ConfigV2Module } from './modules/v2/config-v2.module';

const modules = [
  TypeOrmModule.forFeature([ConfigEntity, AmazonOrderHistoryEntity, InstacartOrderHistoryEntity, WalmartOrderHistoryEntity, AmazonOrdersEntity, InstacartOrdersEntity, WalmartOrdersEntity ]),
  ConfigV1Module,
  ConfigV2Module
];

@Module({
  imports: modules,
  controllers: [],
  providers:[ConfigDbService],
  exports:[
    ConfigV1Module,
    ConfigV2Module
  ]
})
export class ConfigModule {}
