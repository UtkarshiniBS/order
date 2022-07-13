import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, isObject, IsObject, IsOptional, IsString, Matches, ValidateIf, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import ArrayDistinct from "src/common/validators/array-distinct.validators";
import { OrderDetailsDto } from "../orderDetailsDto.dto";
import { scrapingContext } from "src/app.models";

export class CreateOrdersV2Dto {

  @IsString({ message: 'panelistId# should be string'})
  @IsNotEmpty({ message: 'panelistId# should not be empty'})
  @ApiProperty()
  panelistId: string;

  @IsString({ message: 'platformId# should be string'})
  @IsNotEmpty({ message: 'platformId# should not be empty'})
  @Transform((platformId) => platformId.value.toLowerCase())
  @ApiProperty()
  platformId: string;

  @IsString({ message: 'fromDate# should be string'})
  @IsNotEmpty({ message: 'fromDate# should not be empty'})
  @ApiProperty({
    example: "dd-mm-yyyy"
  })
  @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
    message:`fromDate#  should be proper date`
  })
  fromDate: Date;

  @IsString({ message: 'toDate# should be string'})
  @IsNotEmpty({ message: 'toDate# should not be empty'})
  @ApiProperty({
    example: "dd-mm-yyyy"
  })
  @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
    message:`toDate# should be proper date`
  })
  toDate: Date;

  @IsOptional()
  @IsString({ message: 'status# should be string'})
  @ApiProperty()
  status: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'listingScrapeTime# should be number'})
  @ApiPropertyOptional({required: true})
  listingScrapeTime: Number;
  
  @IsOptional()
  @Type(() => Number)
  @IsNumber({},{message: 'listingOrderCount# should be number'})
  @ApiPropertyOptional({required: true})
  listingOrderCount: Number;

  @IsOptional()
  @IsString({ message: 'scrapingSessionContext# should be string'})
  @ApiPropertyOptional()
  scrapingSessionContext: string;

  // @ValidateIf(o => o.scrapingSessionContext === scrapingContext.ONLINE)
  // @IsNotEmpty({ message: 'scrapingSessionStatus# should not be empty'})
  // @IsString({ message: 'scrapingSessionStatus# should be string'})
  // scrapingSessionStatus: string;

  @IsOptional()
  @IsString({ message: 'scrapingSessionStatus# should be string'})
  @ApiPropertyOptional()
  scrapingSessionStatus: string;

  @ValidateIf(o => o.scrapingSessionContext === scrapingContext.ONLINE)
  @IsString({ message: 'scrapingSessionStartedAt# should be string'})
  @IsNotEmpty({ message: 'scrapingSessionStartedAt# should not be empty'})
  @Matches(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]/,{
    message:`scrapingSessionStartedAt# should be proper date`
  })
  @ApiProperty({
    example: "yyyy-MM-dd HH:mm:ss"
  })
  scrapingSessionStartedAt: string;

  @IsOptional()
  @IsString({ message: 'scrapingSessionEndedAt# should be string'})
  @Matches(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]/,{
    message:`scrapingSessionEndedAt# should be proper date`
  })
  @ApiProperty({
    example: "yyyy-MM-dd HH:mm:ss"
  })
  scrapingSessionEndedAt: string;

  @IsOptional()
  @IsString({ message: 'sessionId# should be string'})
  @ApiPropertyOptional()
  sessionId: string;

  @ValidateNested({ each: true })
  @ArrayDistinct('orderId', { message: "orderId# should be unique" })
  @Type(() => OrderDetailsDto)
  // @ArrayMinSize(0)
  // @IsNotEmpty({ message: "data# should not be empty" })
  @IsArray({ message: "data# should be a array" })
  @ApiProperty({
    isArray: true,
    type: OrderDetailsDto,
  })
  data: OrderDetailsDto[];
}