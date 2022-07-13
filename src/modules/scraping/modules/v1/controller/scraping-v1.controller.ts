import { Body, Controller, Get, HttpCode, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DynamicAuthGuard } from 'src/common/guard/dynamic-auth.guard';
import { EventLogsDto } from 'src/modules/scraping/dto/eventLogs.dto';
import { SearchEventLogsDto } from 'src/modules/scraping/dto/searchEventLogs.dto';
import { ScrappingController } from './scraping.controller';

@Controller('v1/scrapping')
@ApiTags('Scrapping Script')

export class ScrappingV1Controller extends ScrappingController {
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
        description: "Provides JS script file path based on latest version for the platformSource & its current version to be used",
        summary:'API to fetch Scrapping JavaScript file URL path & file Version'
    })
    @Get('fetchScript/:platformSource')
    @ApiParam({
        name: 'platformSource',
        required: true,
        type: String,
    })
    @HttpCode(200)
    @ApiExcludeEndpoint()
    getLatestScript(@Param('platformSource') platformSource) {
        return super.getLatestScript(platformSource.toLowerCase());
    }

    @UseGuards(DynamicAuthGuard)
    @ApiExcludeEndpoint()
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @Get('script/:platform/:file')
    @HttpCode(200)
    @ApiExcludeEndpoint()
    downloadScript(@Res() res, @Param('platform') platform, @Param('file') file) {
        return super.downloadScript(res,platform,file);
    }

    @UseGuards(DynamicAuthGuard)
    @ApiExcludeEndpoint()
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @Get('auth-script/:platform/:file')
    @HttpCode(200)
    downloadAuthScript(@Res() res, @Param('platform') platform, @Param('file') file) {
        return super.downloadAuthScript(res,platform,file);
    }

    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @Post('push_events')
    // @Post('push_events/:platformSource')
    @ApiConsumes('application/json')
    @ApiOperation({
      description: 'Accepts Platform Id & Panelist Id pair, event log attributes',
      summary:'API to push event logs'
    })
    @ApiExcludeEndpoint()
    @HttpCode(200)
    @ApiBody({
      type: EventLogsDto
    })
    async pushEvents(@Body() body: EventLogsDto) {
        return await super.pushEvents(body)
    }


    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "Fetches all events data. Also allows to filter data based on user provided query params for `panelistId`', `platformId` & `limit`",
      summary:'API to fetch events'
    })
    @HttpCode(200)
    @ApiExcludeEndpoint()
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'platformId', type: 'String', required: false })
    @ApiQuery({ name: 'limit', type: 'Number', required: false })
    @Get('listEvents')
    async findAll(@Query() body: SearchEventLogsDto): Promise<any[]> {
        return await super.findAll(body);
    }

}
