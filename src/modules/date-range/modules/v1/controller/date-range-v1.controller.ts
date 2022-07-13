import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';
import { CreateDateRangeV1Dto } from '../../../dto/create-date-range-v1.dto';
import { DateRangeController } from './date-range.controller';

@Controller('v1/date-range')
@ApiTags('Date range for Scrapping')

export class DateRangeV1Controller extends DateRangeController {
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
        description: "Date Range is based on account (PanelistId & AmazonId pair). For first time scrapping of data for the account, `start_date` is derived from Scrapping configuration of the ALLOWED_PLATFORMS(like amazon, instacart, etc). If this account already has scrapped data, endDate of the last scrapped order would be startData for the API. endDate is current date on which this API is called.",
        summary:'API to provide Date Range that it to be scrapped'
    })
    @Post()
    @HttpCode(200)
    @ApiBody({
        type: CreateDateRangeV1Dto
    })
    @ApiExcludeEndpoint()
    async getDateRange(@Body() createDateRangeDto: CreateDateRangeV1Dto) {
        return super.getDateRange(createDateRangeDto)
    }

}
