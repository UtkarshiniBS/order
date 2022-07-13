import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from 'src/modules/auth/service/auth.service';
import { AmazonConnectionHistoryEntity } from 'src/modules/connection/entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from 'src/modules/connection/entity/amazon-connection.entity';
import { AmazonOrderHistoryEntity } from 'src/modules/order_history/entity/amazonOrderHistory.entity';
import { UserEntity } from 'src/modules/user/entity/user.entity';
import { UserService } from 'src/modules/user/service/user.service';
import { PiiDetailsEntity } from '../../entity/piiDetails.entity';
import { PiiDetailsService } from '../../service/piiDetails.service';
import { PiiDetailsV2Controller } from './controller/piiDetailsV2.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PiiDetailsEntity, UserEntity, AmazonOrderHistoryEntity, AmazonConnectionHistoryEntity, AmazonConnectionEntity])],
  controllers: [PiiDetailsV2Controller],
  providers: [PiiDetailsService, AuthService, UserService],
  exports: [],
})
export class PiiDetailsV2Module {}
