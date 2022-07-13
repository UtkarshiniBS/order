import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DynamicAuthGuard } from 'src/common/guard/dynamic-auth.guard';
import { KrogerController } from './kroger.controller';

@Controller('v1/kroger')
@ApiTags('Kroger specific features')

export class KrogerV1Controller extends KrogerController {
    @UseGuards(DynamicAuthGuard)
    @ApiBearerAuth('token')
    @ApiBearerAuth('panelist_id')
    @ApiOperation({
      description: "API to fetch kroger subsideries list",
      summary: 'API to fetch kroger subsideries list'
    })
    @Get('subsidiary_list')
    @ApiExcludeEndpoint()
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
    @ApiExcludeEndpoint()
    @HttpCode(200)
    async updateKrogerSubsidiary(@Body() data,  @Req() req, @Res() res) {
        return await super.updateKrogerSubsidiary(data, req, res);
    }
}
