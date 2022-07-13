import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";


class PiiAttributeRegex {

  @IsNotEmpty({ message: "attribute# should not be empty" })
  @IsString({ message: 'attribute# should be string'})
  @ApiProperty({ name: "attribute", type: [String], required: true, example: "Pii Attribute" })
  attribute: string;

  @IsOptional()
  @IsString({ message: 'regex# should be string'})
  @ApiPropertyOptional({ example: "Regex" })
  regex: string;

}

export class UpdatePiiRegexDto {
  @ValidateNested({ each: true })
  @Type(() => PiiAttributeRegex)
  @ApiProperty({
    isArray: true,
    required: true,
    type: PiiAttributeRegex
  })
  @IsNotEmpty({ message: "piiAttributes# should not be empty" })
  @IsArray()
  piiAttributes: [PiiAttributeRegex];
}
