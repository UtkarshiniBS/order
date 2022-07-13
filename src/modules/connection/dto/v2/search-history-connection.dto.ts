import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class SearchHistoryConnectionV2Dto {
    @IsOptional()
    @IsString({ message: 'panelistId# should be string'})
    @ApiPropertyOptional()
    panelistId: string;
    
    @IsOptional()
    @IsString({ message: 'platformId# should be string'})
    @ApiPropertyOptional()
    platformId: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({},{message: 'limit# should be number'})
    @ApiPropertyOptional()
    limit: Number
}