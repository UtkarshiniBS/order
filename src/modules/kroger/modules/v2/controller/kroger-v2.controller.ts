import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KrogerController } from '../../v1/controller/kroger.controller';

@Controller('v2/kroger')
@ApiTags('Kroger specific features')

export class KrogerV2Controller extends KrogerController {

}
