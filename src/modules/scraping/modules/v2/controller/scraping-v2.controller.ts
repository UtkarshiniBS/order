import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import dateFormat from 'dateformat';
import { ALLOWED_PLATFORMS } from 'src/app.models';
import { DynamicAuthGuard } from 'src/common/guard/dynamic-auth.guard';
import { CommonModule } from 'src/common/module/common-module';
import { EventLogsDto } from 'src/modules/scraping/dto/eventLogs.dto';
import { SearchEventLogsDto } from 'src/modules/scraping/dto/searchEventLogs.dto';
import { ScriptType } from 'src/modules/scraping/scraping.service';
import { ScrappingController } from '../../v1/controller/scraping.controller';

@Controller('v2/scrapping')
@ApiTags('Scrapping Script')

export class ScrappingV2Controller extends ScrappingController {
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
        description: "Provides JS script file path based on latest version for the platformSource & its current version to be used",
        summary:'API to fetch Scrapping/Auth JavaScript file URL path & file Version'
    })
    @Get('fetchScript/:platformSource/:scriptType?')
    @ApiParam({
        name: 'platformSource',
        required: true,
        type: String,
        enum: ALLOWED_PLATFORMS
    })
    @HttpCode(200)
    @ApiParam({
        name: 'scriptType',
        required: false,
        type: String,
        enum: ScriptType
    })
    getLatestScript(@Param('platformSource') platformSource,@Param('scriptType') scriptType?) {
        return super.getLatestScript(platformSource.toLowerCase(), scriptType);
    }

    @UseGuards(DynamicAuthGuard)
    @ApiExcludeEndpoint()
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @Get('script/:platform/:file')
    @HttpCode(200)
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
    @Post('push_events/:platformSource')
    // @Post('push_events/:platformSource')
    @ApiConsumes('application/json')
    @ApiOperation({
      description: 'Accepts Platform Id & Panelist Id pair, event log attributes',
      summary:'API to push event logs'
    })
    @ApiParam({
        name: 'platformSource',
        required: true,
        type: String,
        enum: ALLOWED_PLATFORMS
      })
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
    @ApiParam({
        name: 'platformSource',
        required: true,
        type: String,
        enum: ALLOWED_PLATFORMS
    })
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'platformId', type: 'String', required: false })
    @ApiQuery({ name: 'limit', type: 'Number', required: false })
    @Get('listEvents/:platformSource')
    async findAll(@Query() body: SearchEventLogsDto): Promise<any[]> {
        return await super.findAll(body);
    }

}
