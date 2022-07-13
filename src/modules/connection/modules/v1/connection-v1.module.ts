import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { ConnectionCoreController } from '../../connection-core.controller';
import { ConnectionService } from '../../connection.service';
import { AmazonConnectionHistoryEntity } from '../../entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from '../../entity/amazon-connection.entity';
import { AmazonConnectionController, AmazonConnectionControllerV1 } from './controllers/amazon-connection-v1.controller';
import { ConnectionControllerV1 } from './controllers/connection-v1.controller';
import { ConnectionController } from './controllers/connection.controller';

@Module({
  imports: [],
  controllers: [
    ConnectionController,
    ConnectionControllerV1,
    AmazonConnectionController,
    AmazonConnectionControllerV1
  ],
  providers: [ConnectionService, ScraperConfigService],
  exports: [],
})
export class ConnectionV1Module {}
