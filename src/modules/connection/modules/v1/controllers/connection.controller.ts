import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Logger, Req, HttpCode, Query, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DynamicAuthGuard } from 'src/common/guard/dynamic-auth.guard';
import { CommonModule } from 'src/common/module/common-module';
import { ConnectionCoreController } from 'src/modules/connection/connection-core.controller';
import { CreateConnectionV1Dto } from 'src/modules/connection/dto/v1/create-connection.dto';
import { SearchConnectionV1Dto } from 'src/modules/connection/dto/v1/search-connection.dto';
import { SearchHistoryConnectionV1Dto } from 'src/modules/connection/dto/v1/search-history-connection.dto';
import { UpdateConnectionV1Dto } from 'src/modules/connection/dto/v1/update-connection.dto';
import { CreateConnectionV2Dto } from 'src/modules/connection/dto/v2/create-connection.dto';
import { SearchConnectionV2Dto } from 'src/modules/connection/dto/v2/search-connection.dto';
import { UpdateConnectionV2Dto } from 'src/modules/connection/dto/v2/update-connection.dto';
import { ConnectionService, ConnectionState, OrderStatus } from '../../../connection.service';

@Controller('connection')
@ApiTags('Amazon Connection Resources')
export class ConnectionController extends ConnectionCoreController {
  constructor(protected ConnectionService: ConnectionService) { 
    super(ConnectionService);
  }

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
  async registerAccount(@Body() createConnectionV1Dto: CreateConnectionV1Dto, platformSource?: string) {
    Logger.log(createConnectionV1Dto);
    return await super.registerAccount(createConnectionV1Dto, platformSource);
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
  async getAccounts(@Param('panelistId') panelistId) {
    return await super.getAccounts(panelistId)
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
  async updateAccount(@Body() updateConnectionDto: UpdateConnectionV1Dto, @Req() request, platformSource?: string) {
    return await super.updateAccount(updateConnectionDto, request, platformSource);
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
  async getConnections(@Query() body: SearchConnectionV1Dto) {
    return await super.getConnections(body);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches all connection history data. Also allows to filter data based on user provided query params for `panelistId`', `amazonId` & `limit`",
    summary:'API to fetch Connection history'
  })
  @HttpCode(200)
  @ApiQuery({ name: 'panelistId', type: 'String', required: false })
  @ApiQuery({ name: 'amazonId', type: 'String', required: false })
  @ApiQuery({ name: 'limit', type: 'Number', required: false })
  @Get('listConnectionHistory')
  async findAll(@Query() body: SearchHistoryConnectionV1Dto): Promise<any[]> {
    return await super.findAll(body);
  }
}