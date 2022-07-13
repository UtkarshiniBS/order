import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { AmazonOrdersEntity } from 'src/modules/order_history/entity/amazonOrder.entity';
import { AmazonOrderHistoryEntity } from 'src/modules/order_history/entity/amazonOrderHistory.entity';
import { InstacartOrdersEntity } from 'src/modules/order_history/entity/instacartOrder.entity';
import { InstacartOrderHistoryEntity } from 'src/modules/order_history/entity/instacartOrderHistory.entity';
import { WalmartOrdersEntity } from 'src/modules/order_history/entity/walmartOrder.entity';
import { WalmartOrderHistoryEntity } from 'src/modules/order_history/entity/walmartOrderHistory.entity';
import { ConfigEntity } from '../../entiry/config.entity';
import { ConfigDbService } from '../config-db.service';
import { ConfigV2Controller } from './controller/config-v2.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigEntity, AmazonOrderHistoryEntity, InstacartOrderHistoryEntity, WalmartOrderHistoryEntity, AmazonOrdersEntity, InstacartOrdersEntity, WalmartOrdersEntity ])],
  controllers: [ConfigV2Controller],
  providers:[ScraperConfigService, ConfigDbService],
  exports:[]
})
export class ConfigV2Module {}
