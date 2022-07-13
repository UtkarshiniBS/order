import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DynamicAuthGuard } from "src/common/guard/dynamic-auth.guard";
import { CreateConnectionV1Dto } from "src/modules/connection/dto/v1/create-connection.dto";
import { SearchConnectionV1Dto } from "src/modules/connection/dto/v1/search-connection.dto";
import { SearchHistoryConnectionV1Dto } from "src/modules/connection/dto/v1/search-history-connection.dto";
import { UpdateConnectionV1Dto } from "src/modules/connection/dto/v1/update-connection.dto";
import { ConnectionState, OrderStatus } from "../../../connection.service";
import { ConnectionController } from "./connection.controller";

@Controller('v1/connection')
@ApiTags('Amazon Connection Resources')
export class ConnectionControllerV1 extends ConnectionController {

    @Post('register_connection')
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiConsumes('application/x-www-form-urlencoded')
    @ApiOperation({
      description: 'API creates an account with provided `Status` & `OrderStatus`. Also updates the `message` provided & is sent to NCP API if configuration is enabled',
      summary:'API to create & associate an Amazon account with a panelist'
    })
    @ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          panelistId: { type: 'string' },
          amazonId: { type: 'string' },
          status: { type: 'string', enum: [ConnectionState.NEVER_CONNECTED, ConnectionState.CONNECTED, ConnectionState.CONNECTION_IN_PROGRESS] },
          message: { type: 'string' },
          orderStatus: { type: 'string', enum: Object.values(OrderStatus) }
        },
        required: ['panelistId', 'amazonId']
      },
    })
    @ApiExcludeEndpoint()
    async registerAccount(@Body() createConnectionDto: CreateConnectionV1Dto, platformSource?: string) {
      return super.registerAccount(createConnectionDto, platformSource);
    }
  
    @Get('get_accounts/:panelistId')
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: 'Filters one accounts based on status. Only Connected/ConnectedButException are showed',
      summary:'API to get Active accounts of the Panelist'
    })
    @ApiParam({
      name: 'panelistId',
      required: true,
      type: String,
    })
    @ApiExcludeEndpoint()
    async getAccounts(@Param('panelistId') panelistId) {
        return super.getAccounts(panelistId);
    }
  
    @Put('update_status')
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: 'Accepts Platform Id & Panelist Id pair. Updates the account if found',
      summary:'API to update status of an Account'
    })
    @ApiConsumes('application/x-www-form-urlencoded')
    @ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          amazonId: { type: 'string' },
          panelistId: { type: 'string' },
          status: { type: 'string', enum: Object.values(ConnectionState) },
          message: { type: 'string' },
          orderStatus: { type: 'string', enum: Object.values(OrderStatus) }
        },
        required: ['status', 'message', 'amazonId', 'panelistId']
      },
    })
    @ApiExcludeEndpoint()
    async updateAccount(@Body() updateConnectionDto: UpdateConnectionV1Dto, @Req() request, platformSource?: string) {
      return super.updateAccount(updateConnectionDto, request, platformSource);
    }
  
    
    @Get('get_connections')
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "Fetches all Amazon accounts. Also allows to  filter data based on user provided query params for `panelistId`', `amazonId`, `status`, `orderStatus`",
      summary:'API to fetch all Amazon accounts'
    })
    @HttpCode(200)
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'amazonId', type: 'String', required: false })
    @ApiQuery({ name: 'status', type: 'String', required: false })
    @ApiQuery({ name: 'orderStatus', type: 'String', required: false })
    @ApiExcludeEndpoint()
    async getConnections(@Query() body: SearchConnectionV1Dto) {
        return super.getConnections(body);
    }

    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "Fetches all connection history data. Also allows to filter data based on user provided query params for `panelistId`', `amazonId` & `limit`",
      summary:'API to fetch Connection history'
    })
    @HttpCode(200)
    @ApiExcludeEndpoint()
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'amazonId', type: 'String', required: false })
    @ApiQuery({ name: 'limit', type: 'Number', required: false })
    @Get('listConnectionHistory')
    async findAll(@Query() body: SearchHistoryConnectionV1Dto): Promise<any[]> {
      return await super.findAll(body);
    }
}