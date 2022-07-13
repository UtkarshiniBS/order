import { Module } from '@nestjs/common';
import { KrogerV1Module } from './modules/v1/kroger-v1.module';
import { KrogerV2Module } from './modules/v2/kroger-v2.module';

const modules = [
  KrogerV1Module,
  KrogerV2Module
]

@Module({
  imports: modules,
  controllers: [],
  providers: [],
  exports: modules
})
export class KrogerModule {}
