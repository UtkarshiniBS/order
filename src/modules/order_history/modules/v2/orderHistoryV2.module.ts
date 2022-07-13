import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { AuthService } from 'src/modules/auth/service/auth.service';
import { ConnectionService } from 'src/modules/connection/connection.service';
import { AmazonConnectionHistoryEntity } from 'src/modules/connection/entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from 'src/modules/connection/entity/amazon-connection.entity';
import { UserEntity } from 'src/modules/user/entity/user.entity';
import { UserService } from 'src/modules/user/service/user.service';
import { OrderHistoryService } from '../../service/orderHistory.service';
import { OrderHistoryV2Controller } from './controller/orderHistoryV2.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AmazonConnectionEntity, AmazonConnectionHistoryEntity])],
  controllers: [OrderHistoryV2Controller],
  providers: [OrderHistoryService, AuthService, UserService, ScraperConfigService, ConnectionService],
  exports: [],
})
export class OrderHistoryV2Module {}