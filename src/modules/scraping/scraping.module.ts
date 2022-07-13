import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmazonLogsEntity } from './entity/amazon-logs.entity';
import { ScrappingV1Module } from './modules/v1/scraping-v1.module';
import { ScrappingV2Module } from './modules/v2/scraping-v2.module';
const modules = [
  ScrappingV1Module,
  ScrappingV2Module
]
@Module({
  imports: modules,
  controllers: [],
  providers: [],
  exports: modules
})
export class ScrappingModule {}