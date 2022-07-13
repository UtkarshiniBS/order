import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode, Res, HttpException, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ALLOWED_PLATFORMS, ALL_PLATFORMS } from 'src/app.models';
const dateFormat = require('dateformat');
import { CommonModule } from 'src/common/module/common-module';
import { ConfigService } from 'src/common/service/config.service';
import { EventLogsDto } from 'src/modules/scraping/dto/eventLogs.dto';
import { SearchEventLogsDto } from 'src/modules/scraping/dto/searchEventLogs.dto';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';
import { ScrappingService, ScriptType } from '../../../scraping.service';

@Controller('scrapping')
@ApiTags('Scrapping Script')

export class ScrappingController {
    constructor(
        private readonly scrappingService: ScrappingService,
        private readonly configService: ConfigService,
    ) { }
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
    @ApiParam({
        name: 'scriptType',
        required: false,
        type: String,
        enum: ScriptType
    })
    @HttpCode(200)
    async getLatestScript(@Param('platformSource') platformSource, @Param('scriptType') scriptType?) {
        scriptType = scriptType || ScriptType.SCRAPE;
        const source = platformSource.toLowerCase() as string;
        const data = scriptType === ScriptType.AUTH ? await this.getAuthJs(source) : await this.getJs(source);
        if(data.jsVersion) {
            return CommonModule.FormatResponse(HttpStatus.OK, 'JS file url fetched!', data);
        }
        return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Source Not found', null)
    }

    async getJs(source) {
        let jsUrl = `scrapping/script`;
        const date = new Date();
        const dynamicVal = date.toISOString();
        const scrapingConfig: any = await this.configService.scrapingConfig();
        const versionConfig = scrapingConfig.scrapingScriptVersion || null;
        if(versionConfig) {
            return {
                jsUrl: `${jsUrl}/${source}/v${versionConfig[source]}.js?date=${dynamicVal}`,
                jsVersion: versionConfig[source]
            };
        } else return {}
    }

    async getAuthJs(source) {
        let jsUrl = `scrapping/auth-script`;
        const scrapingConfig: any = await this.configService.scrapingConfig();
        const versionConfig = scrapingConfig.authScriptVersion || null;
        if(versionConfig) {
            return {
                jsUrl: `${jsUrl}/${source}/v${versionConfig[source]}.json`,
                jsVersion: versionConfig[source]
            };
        } else return {}
    }

    @UseGuards(DynamicAuthGuard)
    @ApiExcludeEndpoint()
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @Get('script/:platform/:file')
    @HttpCode(200)
    downloadScript(@Res() res, @Param('platform') platform, @Param('file') file) {
        const jsUrl = `es5/${platform}/${file}`;
        return res.sendFile(jsUrl, { root: 'assets' });
    }

    @UseGuards(DynamicAuthGuard)
    @ApiExcludeEndpoint()
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @Get('auth-script/:platform/:file')
    @HttpCode(200)
    downloadAuthScript(@Res() res, @Param('platform') platform, @Param('file') file) {
        const jsonUrl = `auth-scripts/${platform}/${file}`;
        return res.sendFile(jsonUrl, { root: 'assets' });
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
    @HttpCode(200)
    @ApiBody({
      type: EventLogsDto
    })
    async pushEvents(@Body() body: EventLogsDto) {
        try {
            body.fromDate = body.fromDate ? CommonModule.formatDate(body.fromDate) : null
            body.toDate = body.toDate ? CommonModule.formatDate(body.toDate) : null
            const data = await this.scrappingService.pushEvents(body);
            if(body.fromDate) {
                data.fromDate = dateFormat(data.fromDate, "dd-mm-yyyy");
            }
            if(body.toDate) {
                data.toDate = dateFormat(data.toDate, "dd-mm-yyyy");
            }
            data.createdAt = dateFormat(data.createdAt, "dd-mm-yyyy hh:MM:ss");
            data.updatedAt = dateFormat(data.updatedAt, "dd-mm-yyyy hh:MM:ss");
            return CommonModule.FormatResponse(HttpStatus.OK, 'Event logs pushed successfully!', data);    
        } catch(e) {
            throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Event logs upload failed', null), HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "Fetches all events data. Also allows to filter data based on user provided query params for `panelistId`', `platformId` & `limit`",
      summary:'API to fetch events'
    })
    @HttpCode(200)
    @ApiQuery({ name: 'panelistId', type: 'String', required: false })
    @ApiQuery({ name: 'platformId', type: 'String', required: false })
    @ApiQuery({ name: 'limit', type: 'Number', required: false })
    @Get('listEvents')
    async findAll(@Query() body: SearchEventLogsDto): Promise<any[]> {
      const response = await this.scrappingService.findAllEvents(body);
      response.map(x => { x.fromDate = dateFormat(x.fromDate, "dd-mm-yyyy"); x.toDate = dateFormat(x.toDate, "dd-mm-yyyy"); x.createdAt = dateFormat(x.createdAt, "dd-mm-yyyy hh:MM:ss"); x.updatedAt = dateFormat(x.updatedAt, "dd-mm-yyyy hh:MM:ss"); delete x.filePath; return x; });
      return CommonModule.FormatResponse(HttpStatus.OK, 'Event logs fetched successfully!', response);
    }

}
