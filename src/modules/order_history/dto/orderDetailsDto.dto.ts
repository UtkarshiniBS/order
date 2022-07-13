import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class ScrapingTime {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 },{ message: 'pageLoadTime# should be valid number with max 2 decimal precision'})
  @ApiProperty()
  pageLoadTime: Number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 },{ message: 'scrapeTime# should be valid number with max 2 decimal precision'})
  @ApiProperty()
  scrapeTime: Number;

  @IsOptional()
  @IsString({ message: 'scrapingContext# should be string'})
  @ApiProperty()
  scrapingContext: string;
}
export class OrderDetailsDto {
  @IsString({ message: 'orderId# should be string'})
  @IsNotEmpty({ message: 'orderId# should not be empty'})
  @ApiProperty()
  orderId: string;

  @IsString({ message: 'orderDate# should be string'})
  @IsNotEmpty({ message: 'orderDate# should not be empty'})
  @ApiProperty()
  orderDate: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ScrapingTime)
  @ApiPropertyOptional({required: true})
  @IsNotEmpty({ message: "scrapingTime# should not be empty" })
  @IsObject({ message: "scrapingTime# should be a object" })
  scrapingTime: ScrapingTime;

}
