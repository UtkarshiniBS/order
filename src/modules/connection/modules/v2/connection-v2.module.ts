import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionService } from '../../connection.service';
import { AmazonConnectionHistoryEntity } from '../../entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from '../../entity/amazon-connection.entity';
import { ConnectionControllerV2 } from './controllers/connection-v2.controller';
import { AmazonConnectionControllerV2 } from './controllers/amazon-connection-v2.controller';
import { ConnectionCoreController } from '../../connection-core.controller';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';

@Module({
  imports: [],
  controllers: [
    ConnectionControllerV2,
    // AmazonConnectionControllerV2
  ],
  providers: [ConnectionService, ScraperConfigService],
  exports: [],
})
export class ConnectionV2Module {}
