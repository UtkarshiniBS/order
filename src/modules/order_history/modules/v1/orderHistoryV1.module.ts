import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { AuthService } from 'src/modules/auth/service/auth.service';
import { ConnectionService } from 'src/modules/connection/connection.service';
import { AmazonConnectionHistoryEntity } from 'src/modules/connection/entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from 'src/modules/connection/entity/amazon-connection.entity';
import { AmazonLogsEntity } from 'src/modules/scraping/entity/amazon-logs.entity';
import { UserEntity } from 'src/modules/user/entity/user.entity';
import { UserService } from 'src/modules/user/service/user.service';
import { AmazonOrderHistoryEntity } from '../../entity/amazonOrderHistory.entity';
import { OrderHistoryService } from '../../service/orderHistory.service';
import { OrderHistoryController } from './controller/orderHistory.controller';
import { OrderHistoryV1Controller } from './controller/orderHistoryV1.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AmazonOrderHistoryEntity, UserEntity, AmazonConnectionEntity, AmazonConnectionHistoryEntity, AmazonLogsEntity])],
  controllers: [OrderHistoryController, OrderHistoryV1Controller],
  providers: [OrderHistoryService, AuthService, UserService, ScraperConfigService, ConnectionService],
  exports: [],
})
export class OrderHistoryV1Module {}