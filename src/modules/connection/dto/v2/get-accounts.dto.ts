import { PartialType, ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsEnum, IsNotEmpty, ArrayMinSize, IsEmpty, ValidateNested, IsArray } from "class-validator";
import { ALLOWED_PLATFORMS } from "src/app.models";


export class GetAccountsDto {
    @IsArray({ message: "platformSources# should be array" })
    @IsOptional()
    @ApiProperty({
        required: false,
        isArray: true,
        type: String
    })
    // @IsEnum(ALLOWED_PLATFORMS, { message: `platformSources# should be among ${Object.values(ALLOWED_PLATFORMS).join(', ')}`})
    platformSources: string[];
}