import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from 'src/common/service/config.service';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { AmazonOrdersEntity } from 'src/modules/order_history/entity/amazonOrder.entity';
import { AmazonOrderHistoryEntity } from 'src/modules/order_history/entity/amazonOrderHistory.entity';
import { InstacartOrdersEntity } from 'src/modules/order_history/entity/instacartOrder.entity';
import { InstacartOrderHistoryEntity } from 'src/modules/order_history/entity/instacartOrderHistory.entity';
import { WalmartOrdersEntity } from 'src/modules/order_history/entity/walmartOrder.entity';
import { WalmartOrderHistoryEntity } from 'src/modules/order_history/entity/walmartOrderHistory.entity';
import { ConfigEntity } from '../../entiry/config.entity';
import { ConfigDbService } from '../config-db.service';
import { ConfigV1Controller } from './controller/config-v1.controller';
import { ConfigController } from './controller/config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigEntity, AmazonOrderHistoryEntity, InstacartOrderHistoryEntity, WalmartOrderHistoryEntity, AmazonOrdersEntity, InstacartOrdersEntity, WalmartOrdersEntity ])],
  controllers: [ConfigController, ConfigV1Controller],
  providers:[ScraperConfigService, ConfigDbService],
  exports:[]
})
export class ConfigV1Module {}
