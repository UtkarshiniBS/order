import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommonModule } from 'src/common/module/common-module';
import { DateRangeService } from './date-range.service';
import { CreateDateRangeV1Dto } from './dto/create-date-range-v1.dto';
import { CreateDateRangeV2Dto } from './dto/create-date-range-v2.dto';

@Controller()
export class DateRangeCoreController {

    constructor(
        protected readonly dateRangeService: DateRangeService
    ) { }

    async getDateRange(createDateRangeDto: CreateDateRangeV1Dto | CreateDateRangeV2Dto | any, platformSource?) {
        const dateRange = await this.dateRangeService.frameDateRange(createDateRangeDto, platformSource);
        return CommonModule.FormatResponse(HttpStatus.OK, "Date range fetched successfully!", dateRange);
    }

}
