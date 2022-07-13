import { BadRequestException, Controller, Get, Header, HttpCode, HttpException, HttpStatus, Logger, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Body, Query } from '@nestjs/common/decorators/http/route-params.decorator';
import { UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { fileFilter } from '../../../../../common/utils/file-upload.utils';
import { Res } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';
import { CreateOrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/createOrderHistoryV1.dto';
import { CreateOrdersV1Dto } from 'src/modules/order_history/dto/v1/createOrdersV1.dto';
import { OrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/orderHistoryV1.dto';
import { SearchOrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/searchOrderHistoryV1.dto';
import { OrderHistoryV1Controller } from '../../v1/controller/orderHistoryV1.controller';
import { CreateOrdersV2Dto } from 'src/modules/order_history/dto/v2/createOrdersV2.dto';
import { CreateOrderHistoryV2Dto } from 'src/modules/order_history/dto/v2/createOrderHistoryV2.dto';
import { ALLOWED_PLATFORMS } from 'src/app.models';
import { OrderHistoryController } from '../../v1/controller/orderHistory.controller';
import { SearchOrderHistoryV2Dto } from 'src/modules/order_history/dto/v2/searchOrderHistoryV2.dto';
import { OrderHistoryCoreController } from 'src/modules/order_history/orderHistoryCore.controller';

@Controller('v2/order_history')
@ApiTags('Order History Resources')
export class OrderHistoryV2Controller extends OrderHistoryCoreController {

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @Post('upload_orders/:platformSource')
  @ApiConsumes('application/json')
  @ApiOperation({
    description: 'Accepts Platform Id & Panelist Id pair, date range & Order Details Json',
    summary:'API to upload Order History with Order Details Json data'
  })
  @HttpCode(200)
  @ApiBody({
    type: CreateOrdersV2Dto
  })
  @ApiParam({
    name: 'platformSource',
    required: true,
    type: String,
    enum: ALLOWED_PLATFORMS
  })
  // @ApiExcludeEndpoint()
  async uploadOrders(@Body() body: CreateOrdersV2Dto, @Param('platformSource') platformSource) {
    return super.uploadOrders(body, platformSource?.toLowerCase());
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: 'Accepts Platform Id & Panelist Id pair, date range & CSV file',
    summary:'API to upload Order History with CSV data'
  })
  @Post('upload_order_history/:platformSource')
  @ApiConsumes('multipart/form-data')
  @HttpCode(200)
  @ApiBody({
    type: CreateOrderHistoryV2Dto
  })
  @ApiParam({
    name: 'platformSource',
    required: true,
    type: String,
    enum: ALLOWED_PLATFORMS
  })
  // @ApiExcludeEndpoint()
  @UseInterceptors(FileInterceptor('file', { fileFilter }))
  async uploadOrderHistory(@Body() body: CreateOrderHistoryV2Dto, @UploadedFile() file: Express.Multer.File, @Param('platformSource') platformSource) {
    return super.uploadOrderHistory(body, file, platformSource.toLowerCase());
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
  @ApiQuery({ name: 'platformId', type: 'String', required: false })
  @Get('list/:platformSource')
  @ApiParam({
    name: 'platformSource',
    required: true,
    type: String,
    enum: ALLOWED_PLATFORMS
  })
  // @ApiExcludeEndpoint()
  async findAll(@Query() body: SearchOrderHistoryV2Dto): Promise<OrderHistoryV1Dto[]> {
    return super.findAll(body);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches all orders data. Also allows to filter data based on user provided query params for `panelistId`', `amazonId`, `fromDate`, `toDate`",
    summary:'API to fetch all Individual Orders uploaded'
  })
  @HttpCode(200)
  @ApiQuery({ name: 'fromDate', type: 'Date', required: false })
  @ApiQuery({ name: 'toDate', type: 'Date', required: false })
  @ApiQuery({ name: 'panelistId', type: 'String', required: false })
  @ApiQuery({ name: 'platformId', type: 'String', required: false })
  @Get('list_orders/:platformSource')
  @ApiParam({
    name: 'platformSource',
    required: true,
    type: String,
    enum: ALLOWED_PLATFORMS
  })
  // @ApiExcludeEndpoint()
  async findAllOrders(@Query() body: SearchOrderHistoryV2Dto): Promise<OrderHistoryV1Dto[]> {
    return super.findAllOrders(body);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Reads order history data from `File Storage` and provided as text output",
    summary:'API to view order history CSV data by filename'
  })
  @Get(':filename/:platformSource')
  @ApiParam({
    name: 'filename',
    required: true,
    type: String,
  })
  @ApiParam({
    name: 'platformSource',
    required: true,
    type: String,
    enum: ALLOWED_PLATFORMS
  })
  // @ApiExcludeEndpoint()
  async getFile(@Param('filename') filename, @Res() res): Promise<any> {
    return super.getFile(filename, res);
  }
}