import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConnectionControllerV1 } from "../../v1/controllers/connection-v1.controller";
import { ConnectionControllerV2 } from "./connection-v2.controller";

@Controller('v2/amazon-connection')
@ApiTags('Amazon Connection Resources')
export class AmazonConnectionControllerV2 extends ConnectionControllerV2 {}