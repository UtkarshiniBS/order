import { Module } from '@nestjs/common';
import { PiiDetailsV1Module } from './modules/v1/piiDetailsV1.module';
import { PiiDetailsV2Module } from './modules/v2/piiDetailsV2.module';
const modules = [
  PiiDetailsV1Module,
  PiiDetailsV2Module
]
@Module({
  imports: modules,
  controllers: [],
  providers: [],
  exports: modules,
})
export class PiiDetailsModule {}
