import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode, Res, Req, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { DynamicAuthGuard } from 'src/common/guard/dynamic-auth.guard';
import { KrogerCoreController } from 'src/modules/kroger/kroger-core.controller';

@Controller('kroger')
@ApiTags('Kroger specific features')
export class KrogerController extends KrogerCoreController {

    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "API to fetch kroger subsideries list",
      summary: 'API to fetch kroger subsideries list'
    })
    @Get('subsidiary_list')
    @HttpCode(200)
    getKrogerSubsidiary(@Res() res) {
        return super.getKrogerSubsidiary(res);
    }

    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "API to update subsideries list in HTML format",
      summary: 'API to update subsideries list in HTML format'
    })
    @Post('subsidiary_list')
    @ApiBody({
        required: true,
        type: 'text/plain',
        schema: {
          type: 'string',
          example: 'HTML string here'
        },
    })
    @ApiExcludeEndpoint()
    @HttpCode(200)
    async updateKrogerSubsidiary(@Body() data,  @Req() req, @Res() res) {
        return await super.updateKrogerSubsidiary(data, req, res);
    }
}
