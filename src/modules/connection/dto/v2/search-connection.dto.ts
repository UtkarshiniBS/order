import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ConnectionState, OrderStatus } from '../../connection.service';
import { CreateConnectionV2Dto } from './create-connection.dto';

export class SearchConnectionV2Dto extends PartialType(CreateConnectionV2Dto) {
    @IsOptional()
    @IsString({ message: 'panelistId# should be string'})
    @ApiPropertyOptional()
    panelistId: string;
    
    @IsOptional()
    @IsString({ message: 'platformId# should be string'})
    @Transform((platformId) => platformId.value.toLowerCase())
    @ApiPropertyOptional()
    platformId: string;

    @IsOptional()
    @IsEnum(ConnectionState, { message: `status# should be ${ConnectionState}`})
    @ApiPropertyOptional({enum: ConnectionState})
    status: ConnectionState;

    @IsOptional()
    @IsEnum(OrderStatus, { message: `orderStatus# should be among ${Object.values(OrderStatus)}`})
    @ApiPropertyOptional({enum: OrderStatus})
    orderStatus: OrderStatus;
}
