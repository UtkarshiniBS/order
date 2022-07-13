import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConnectionControllerV1 } from "./connection-v1.controller";

@Controller('amazon-connection')
@ApiTags('Amazon Connection Resources')
export class AmazonConnectionController extends ConnectionControllerV1 {}

@Controller('v1/amazon-connection')
@ApiTags('Amazon Connection Resources')
export class AmazonConnectionControllerV1 extends ConnectionControllerV1 {}
