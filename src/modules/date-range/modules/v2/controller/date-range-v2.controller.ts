import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ALLOWED_PLATFORMS } from 'src/app.models';
import { DateRangeCoreController } from 'src/modules/date-range/date-range-core.controller';
import { CreateDateRangeV2Dto } from 'src/modules/date-range/dto/create-date-range-v2.dto';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';

@Controller('v2/date-range')
@ApiTags('Date range for Scrapping')

export class DateRangeV2Controller extends DateRangeCoreController {
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
        description: "Date Range is based on account (PanelistId & AmazonId pair). For first time scrapping of data for the account, `start_date` is derived from Scrapping configuration of the ALLOWED_PLATFORMS(like amazon, instacart, etc). If this account already has scrapped data, endDate of the last scrapped order would be startData for the API. endDate is current date on which this API is called.",
        summary:'API to provide Date Range that it to be scrapped'
    })
    @Post(':platformSource')
    @HttpCode(200)
    @ApiBody({
        type: CreateDateRangeV2Dto
    })
    @ApiParam({
        name: 'platformSource',
        required: true,
        type: String,
        enum: ALLOWED_PLATFORMS
    })
    async getDateRange(@Body() createDateRangeDto: CreateDateRangeV2Dto, @Param('platformSource') platformSource?) {
        return super.getDateRange(createDateRangeDto, platformSource);
    }

}
