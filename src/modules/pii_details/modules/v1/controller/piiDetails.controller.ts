import { Controller, Get, HttpStatus, Logger, Post, Put, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body } from '@nestjs/common/decorators/http/route-params.decorator';
import { PiiDetailsDto } from '../../../dto/piiDetails.dto';
import { UpdatePiiDetailsDto } from '../../../dto/updatePiiDetails.dto';
import { PiiDetailsService } from '../../../service/piiDetails.service';
import { LocalAuthGuard } from '../../../../../common/guard/local-auth.guard';

import { AuthService } from '../../../../auth/service/auth.service';
import { CommonModule } from '../../../../../common/module/common-module';
import { DynamicAuthGuard } from '../../../../../common/guard/dynamic-auth.guard';
import { UpdatePiiRegexDto } from 'src/modules/pii_details/dto/updatePiiRegex.dto';

@Controller('pii')
@ApiTags('Personal Identity Info (PII) Resources')
export class PiiDetailsController {
  constructor(
    private piiDetailsService: PiiDetailsService,
    private authService: AuthService
  ) { }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Lists all PII data that is derived from the Amazon CSV Report file",
    summary:'API to list all PII attributes in Amazon CSV Output'
  })
  @Get('pii_list')
  async findAll(): Promise<PiiDetailsDto[]> {
    const response = await this.piiDetailsService.findAll();
    const msg = response.length > 0 ? 'PII attributes fetched successfully!' : 'PII attribute not found!';
    return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Lists PII attributes with status as `false` which means these attributes are deactivated(Disallowed) & signifies to be removed from the Output data of CSV as a part of Post Processing. It is used by mobile SDK to remove them & upload to backend",
    summary:'API to list PII attributes to be removed from CSV'
  })
  @Get('deactive_pii_list')
  async deactive_pii() {
    const response = await this.piiDetailsService.findActiveDeactive(false);
    const msg = response.length > 0 ? 'Deactive PII attributes fetched successfully!' : 'Deactive PII attribute not found!';
    return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  }

  // @UseGuards(DynamicAuthGuard)
  // @ApiBearerAuth('token')
  // @ApiBearerAuth('panelist_id')
  // @Get('active_pii_list')
  // async active_pii() {
  //   const response = await this.piiDetailsService.findActiveDeactive(true);
  //   const msg = response.length > 0 ? 'Active PII attributes fetched successfully!' : 'Active PII attribute not found!';
  //   return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  // }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Accepts list of valid PII atributes that are to be deactivated. It is used by backend Admin to configure appropriate PII attributes to be removed from CSV data",
    summary:'API to deactivate PII data'
  })
  @Put('deactivate_pii')
  async update_pii(@Body() piiDetails: UpdatePiiDetailsDto) {
    const req = piiDetails;
    let response = [];
    if (!req.attributes.length) {
      return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Invalid request!', null);
    }
    await Promise.all(req.attributes.map(async (attribute) => {
      try {
        let insertResponse = await this.piiDetailsService.updatePii(attribute, false);
        response.push(insertResponse);
      } catch (error) {
        return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, error, null);
      }
    }));
    const msg = response.length > 0 ? 'PII attribute deactivated successfully!' : 'PII attribute is already deactivated!';
    return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Accepts list of valid PII atributes that are to be activated. It is used by backend Admin to configure appropriate PII attributes which are allowed & to be included in CSV data",
    summary:'API to activate PII data'
  })
  @Put('activate_pii')
  async activate_pii(@Body() piiDetails: UpdatePiiDetailsDto) {
    const req = piiDetails;
    let response = [];
    if (!req.attributes.length) {
      return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Invalid request!', null);
    }
    await Promise.all(req.attributes.map(async (attribute) => {
      try {
        let insertResponse = await this.piiDetailsService.updatePii(attribute, true);
        response.push(insertResponse);
      } catch (error) {
        return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, error, null);
      }
    }));
    const msg = response.length > 0 ? 'PII attribute activated successfully!' : 'PII attribute is already activated!';
    return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Accepts list of valid PII atributes with regex. It is used to apply regex to the attribute scrapped in the CSV",
    summary:'API to update regex for PII data'
  })
  @ApiBody({
    type: UpdatePiiRegexDto
  })
  @Put('regex_pii')
  async update_pii_regex(@Body() piiDetails: UpdatePiiRegexDto) {
    const req = piiDetails;
    let response = [];
    if (!req.piiAttributes.length) {
      return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Invalid request!', null);
    }
    await Promise.all(req.piiAttributes.map(async (piiDetail) => {
      try {
        let insertResponse = await this.piiDetailsService.updatePiiRegex(piiDetail.attribute, piiDetail.regex);
        response.push(insertResponse);
      } catch (error) {
        return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, error, null);
      }
    }));
    const msg = response.length > 0 ? 'PII attribute regex updated successfully!' : 'PII attribute regex was not able to update';
    return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiOperation({
    description: "Seeds default set of all PII data if not already in DB, Also it updates Order history tables with `lastOrderId` data for existing records with no `lastOrderId` data",
    summary:'API to Seed PII attributes to DB'
  })
  // @ApiExcludeEndpoint()
  @Get('seed_attributes')
  async seedAttributes() {
    const response = await this.piiDetailsService.seedAttributes();
    const msg = response ? 'PII attributes seeded successfully!' : 'PII attributes already found!';
    return CommonModule.FormatResponse(HttpStatus.OK, msg, response);
  }

}
