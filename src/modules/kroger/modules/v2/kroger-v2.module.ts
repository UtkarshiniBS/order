import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KrogerService } from '../../kroger.service';
import { KrogerV2Controller } from './controller/kroger-v2.controller';
@Module({
  imports: [],
  controllers: [KrogerV2Controller],
  providers: [KrogerService],
  exports: []
})
export class KrogerV2Module {}
