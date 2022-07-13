import { BadRequestException, Controller, Get, Header, HttpCode, HttpException, HttpStatus, Logger, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Body, Query } from '@nestjs/common/decorators/http/route-params.decorator';
import { diskStorage } from 'multer';
import { OrderHistoryService } from '../../../service/orderHistory.service';
import { ConnectionService } from '../../../../connection/connection.service';
import { LocalAuthGuard } from '../../../../../common/guard/local-auth.guard';
import { ScraperConfigService } from '../../../../../common/service/scraperConfig.service';
import { AuthService } from '../../../../auth/service/auth.service';
import { ConfigService } from '../../../../../common/service/config.service';
import { UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { editfilename, fileFilter, generateName } from '../../../../../common/utils/file-upload.utils';
import { CommonModule } from '../../../../../common/module/common-module';
import { Res } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';

import path = require('path');
import { CreateOrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/createOrderHistoryV1.dto';
import { CreateOrdersV1Dto } from 'src/modules/order_history/dto/v1/createOrdersV1.dto';
import { OrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/orderHistoryV1.dto';
import { SearchOrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/searchOrderHistoryV1.dto';
import { CreateOrdersV2Dto } from 'src/modules/order_history/dto/v2/createOrdersV2.dto';
import { SearchOrderHistoryV2Dto } from 'src/modules/order_history/dto/v2/searchOrderHistoryV2.dto';
import { ScrappingType } from 'src/common/entityTypes/orderHistoryEntity.type';
import { ALLOWED_PLATFORMS, ALL_PLATFORMS } from 'src/app.models';
import { OrderHistoryCoreController } from 'src/modules/order_history/orderHistoryCore.controller';
const fs = require('fs');
const dateFormat = require('dateformat');
const streamifier = require('streamifier');
const csv = require('csv-parse');

@Controller('order_history')
@ApiTags('Order History Resources')
export class OrderHistoryController extends OrderHistoryCoreController {

  constructor(
    protected orderHistoryService: OrderHistoryService,
    protected authService: AuthService,
    protected scraperConfigService: ScraperConfigService,
    protected connectionService: ConnectionService,
    protected configService: ConfigService
  ) {
    super(orderHistoryService, authService, scraperConfigService, connectionService, configService);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @Post('upload_orders')
  @ApiConsumes('application/json')
  @ApiOperation({
    description: 'Accepts Platform Id & Panelist Id pair, date range & Order Details Json',
    summary:'API to upload Order History with Order Details Json data'
  })
  @HttpCode(200)
  @ApiBody({
    type: CreateOrdersV1Dto
  })
  async uploadOrders(@Body() body: CreateOrdersV1Dto, platformSource?: ALL_PLATFORMS) {
    return await super.uploadOrders(body, ALL_PLATFORMS.AMAZON);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: 'Accepts Platform Id & Panelist Id pair, date range & CSV file',
    summary:'API to upload Order History with CSV data'
  })
  @Post('upload_order_history')
  @ApiConsumes('multipart/form-data')
  @HttpCode(200)
  @ApiBody({
    type: CreateOrderHistoryV1Dto
  })
  @UseInterceptors(FileInterceptor('file', { fileFilter }))
  async uploadOrderHistory(@Body() body: CreateOrderHistoryV1Dto, @UploadedFile() file: Express.Multer.File, platformSource?: string) {
    return await super.uploadOrderHistory(body, file, platformSource);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches all order history data. Also allows to filter data based on user provided query params for `panelistId`', `amazonId`, `fromDate`, `toDate`",
    summary:'API to fetch history of all Orders uploaded'
  })
  @HttpCode(200)
  @ApiQuery({ name: 'fromDate', type: 'Date', required: false })
  @ApiQuery({ name: 'toDate', type: 'Date', required: false })
  @ApiQuery({ name: 'panelistId', type: 'String', required: false })
  @ApiQuery({ name: 'amazonId', type: 'String', required: false })
  @Get('list')
  async findAll(@Query() body: SearchOrderHistoryV1Dto): Promise<OrderHistoryV1Dto[]> {
    return await super.findAll(body);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Reads order history data from `File Storage` and provided as text output",
    summary:'API to view order history CSV data by filename'
  })
  @Get(':filename')
  @ApiParam({
    name: 'filename',
    required: true,
    type: String,
  })
  async getFile(@Param('filename') filename, @Res() res): Promise<any> {
    return await super.getFile(filename, res);
  }
}