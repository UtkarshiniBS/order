import { Module } from '@nestjs/common';
import { ScrappingService } from '../../scraping.service';
import { ScrappingV2Controller } from './controller/scraping-v2.controller';

@Module({
  imports: [
  ],
  controllers: [ScrappingV2Controller],
  providers: [ScrappingService],
  exports: [
    ScrappingService
  ]
})
export class ScrappingV2Module {}
