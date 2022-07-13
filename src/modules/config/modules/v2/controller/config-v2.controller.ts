import { Controller, UseGuards, Put, Body, Res, Post, Get, Param, Query, Headers } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiExcludeEndpoint, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ALLOWED_PLATFORMS } from "src/app.models";
import { ApiKeyAuthGuard } from "src/common/guard/api-key-auth.guard";
import { DynamicAuthGuard } from "src/common/guard/dynamic-auth.guard";
import { ConfigDto, ConfigUpdateSwaggerDto, CreateGetConfigDto } from "src/modules/config/dto/config.dto";
import { ConfigV1Controller } from "../../v1/controller/config-v1.controller";

@Controller('v2/scraper_config')
@ApiTags('Scraper Configuration')
export class ConfigV2Controller extends ConfigV1Controller {

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  // @ApiExcludeEndpoint()
  @ApiOperation({
    description: "Updates general & platform specific configuration. General Configuration are used as a fallback mecahnism when platform specific configuration is not configured already",
    summary: 'API to update scrapping configuration'
  })
  @Put('update')
  @ApiBody(ConfigUpdateSwaggerDto)
  async updateGeneralConfig(@Body() body: ConfigDto, @Res() res: Response|any) {
    return super.updateGeneralConfig(body, res)
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches scrapping configuration based on provided platformSources. If a platformSource is not configured already, it falls back to global configuration and provides them in the result",
    summary: 'API to fetch scrapping configuration for the list of platformSources'
  })
  @Post('get_config')
  // @ApiExcludeEndpoint()
  async getConfigDetails(@Body() body: CreateGetConfigDto, @Res() response: Response|any) {
    return super.getConfigDetails(body, response)
  }

   //@UseGuards(DynamicAuthGuard)
   @UseGuards(ApiKeyAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Fetches default global configuration from `scrapperConfig` file in the file system. If file not already exists, this API would create a default configuration file",
    summary: 'API to fetch global configuration'
  })
  @Get()
  // @ApiExcludeEndpoint()
  async getGeneralConfig(@Res() res: Response|any) {
    super.getGeneralConfig(res);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Determines whether to show this flag based on day user requests",
    summary: 'API to show $$ flag in the APP using `manualScrapeIncentiveDays` configuration'
  })
  @ApiQuery({ name: 'timezone', type: 'String', required: false })
  @Get('show_incentive_flag')
  async isManualScrapeIncentiveActive(@Query('timezone') timezone: string, @Res() res: Response|any, @Headers() headers: Record < string, string >) {
    super.isManualScrapeIncentiveActive(timezone, res, headers);
  }
}