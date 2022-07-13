import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DynamicAuthGuard } from "src/common/guard/dynamic-auth.guard";
import { CreateConnectionV1Dto } from "src/modules/connection/dto/v1/create-connection.dto";
import { CreateConnectionV2Dto } from "src/modules/connection/dto/v2/create-connection.dto";
import { SearchConnectionV1Dto } from "src/modules/connection/dto/v1/search-connection.dto";
import { SearchConnectionV2Dto } from "src/modules/connection/dto/v2/search-connection.dto";
import { UpdateConnectionV1Dto } from "src/modules/connection/dto/v1/update-connection.dto";
import { UpdateConnectionV2Dto } from "src/modules/connection/dto/v2/update-connection.dto";
import { ConnectionService, ConnectionState, OrderStatus } from "../../../connection.service";
import { ConnectionControllerV1 } from "../../v1/controllers/connection-v1.controller";
import { ALLOWED_PLATFORMS } from "src/app.models";
import { CommonModule } from "src/common/module/common-module";
import { GetAccountsDto } from "src/modules/connection/dto/v2/get-accounts.dto";
import { ConnectionController } from "../../v1/controllers/connection.controller";
import { ConnectionCoreController } from "src/modules/connection/connection-core.controller";
import { SearchHistoryConnectionV2Dto } from "src/modules/connection/dto/v2/search-history-connection.dto";

@Controller('v2/connection')
@ApiTags('Connection Resources')
export class ConnectionControllerV2 extends ConnectionCoreController {
  
  constructor(ConnectionService: ConnectionService) {
    super(ConnectionService);
  }

    @Post('register_connection/:platformSource')
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
          platformId: { type: 'string' },
          status: { type: 'string', enum: [ConnectionState.NEVER_CONNECTED, ConnectionState.CONNECTED, ConnectionState.CONNECTION_IN_PROGRESS] },
          message: { type: 'string' },
          orderStatus: { type: 'string', enum: Object.values(OrderStatus) }
        },
        required: ['panelistId', 'platformId']
      },
    })
    @ApiParam({
      name: 'platformSource',
      required: true,
      type: String,
      enum: ALLOWED_PLATFORMS
    })
    // @ApiExcludeEndpoint()
    async registerAccount(@Body() createConnectionDto: CreateConnectionV2Dto, @Param('platformSource') platformSource) {
      return super.registerAccount(createConnectionDto, platformSource.toLowerCase());
    }
  
    @Post('get_accounts/:panelistId')
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: 'Filters one accounts based on status for each `platformSource` provided. Only Connected/ConnectedButException are showed',
      summary:'API to get Active accounts of the Panelist'
    })
    @ApiParam({
      name: 'panelistId',
      required: true,
      type: String,
    })
    @ApiBody({
      type: GetAccountsDto
    })
    // @ApiExcludeEndpoint()
    async getPlatformSourceAccounts(@Param('panelistId') panelistId, @Body() body: GetAccountsDto) {
      if(body.platformSources && body.platformSources.length) {
        body.platformSources = body.platformSources.map(d => d.toLowerCase()) 
        return await this.getAllAccounts(panelistId, body.platformSources);
      }
      return await this.getAllAccounts(panelistId);
    }

    // @ApiExcludeEndpoint()
    async getAllAccounts(@Param('panelistId') panelistId, platformSourcesInput?: string[]) {
      const allData = [];
      const allSources = Object.values(ALLOWED_PLATFORMS) as string[];
      const platformSources = platformSourcesInput ? platformSourcesInput : allSources;
      for (let index = 0; index < platformSources.length; index++) {
        const platformSource = platformSources[index];
        if(allSources.includes(platformSource)) {
          // request.params.platformSource = platformSource;
          const result = await this.ConnectionService.getAccounts(panelistId, platformSource);
          result.res['platformSource'] = platformSource;
          allData.push(result.res);
        }
      }
      return CommonModule.FormatResponse(HttpStatus.OK, "Accounts fetched successfully!", allData);
        // return super.getAccounts(panelistId);
    }
  
    @Put('update_status/:platformSource')
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
          platformId: { type: 'string' },
          panelistId: { type: 'string' },
          status: { type: 'string', enum: Object.values(ConnectionState) },
          message: { type: 'string' },
          orderStatus: { type: 'string', enum: Object.values(OrderStatus) }
        },
        required: ['status', 'message', 'platformId', 'panelistId']
      },
    })
    @ApiParam({
      name: 'platformSource',
      required: true,
      type: String,
      enum: ALLOWED_PLATFORMS
    })
    // @ApiExcludeEndpoint()
    async updateAccount(@Body() updateConnectionDto: UpdateConnectionV2Dto, @Req() request, @Param('platformSource') platformSource) {
      return super.updateAccount(updateConnectionDto, request, platformSource.toLowerCase());
    }
  
    
    @Get('get_connections/:platformSource')
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "Fetches all Amazon accounts. Also allows to  filter data based on user provided query params for `panelistId`', `platformId`, `status`, `orderStatus`",
      summary:'API to fetch all Amazon accounts'
    })
    @HttpCode(200)
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'platformId', type: 'String', required: false })
    @ApiQuery({ name: 'status', type: 'String', required: false })
    @ApiQuery({ name: 'orderStatus', type: 'String', required: false })
    @ApiParam({
      name: 'platformSource',
      required: true,
      type: String,
      enum: ALLOWED_PLATFORMS
    })
    // @ApiExcludeEndpoint()
    async getConnections(@Query() body: SearchConnectionV2Dto) {
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
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'platformId', type: 'String', required: false })
    @ApiQuery({ name: 'limit', type: 'Number', required: false })
    @ApiParam({
      name: 'platformSource',
      required: true,
      type: String,
      enum: ALLOWED_PLATFORMS
    })
    @Get('listConnectionHistory/:platformSource')
    async findAll(@Query() body: SearchHistoryConnectionV2Dto): Promise<any[]> {
      return await super.findAll(body);
    }
}