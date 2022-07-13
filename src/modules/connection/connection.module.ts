import { Module } from '@nestjs/common';
import { ConnectionV1Module } from './modules/v1/connection-v1.module';
import { ConnectionV2Module } from './modules/v2/connection-v2.module';

const modules = [
  ConnectionV1Module,
  ConnectionV2Module
];

@Module({
  imports: modules,
  controllers: [],
  providers: [],
  exports: modules,
})
export class ConnectionModule {}
