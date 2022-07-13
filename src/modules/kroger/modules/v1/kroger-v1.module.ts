import { Module } from '@nestjs/common';
import { KrogerService } from '../../kroger.service';
import { KrogerV1Controller } from './controller/kroger-v1.controller';
import { KrogerController } from './controller/kroger.controller';
@Module({
  imports: [],
  controllers: [KrogerController, KrogerV1Controller],
  providers: [KrogerService],
  exports: []
})
export class KrogerV1Module {}
