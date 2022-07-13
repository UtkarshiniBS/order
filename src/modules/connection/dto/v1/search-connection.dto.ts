import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ConnectionState, OrderStatus } from '../../connection.service';
import { CreateConnectionV1Dto } from './create-connection.dto';

export class SearchConnectionV1Dto extends PartialType(CreateConnectionV1Dto) {
    @IsOptional()
    @IsString({ message: 'panelistId# should be string'})
    @ApiPropertyOptional()
    panelistId: string;
    
    @IsOptional()
    @IsString({ message: 'amazonId# should be string'})
    @Transform((amazonId) => amazonId.value.toLowerCase())
    @ApiPropertyOptional()
    amazonId: string;

    @IsOptional()
    @IsEnum(ConnectionState, { message: `status# should be ${ConnectionState}`})
    @ApiPropertyOptional({enum: ConnectionState})
    status: ConnectionState;

    @IsOptional()
    @IsEnum(OrderStatus, { message: `orderStatus# should be among ${Object.values(OrderStatus)}`})
    @ApiPropertyOptional({enum: OrderStatus})
    orderStatus: OrderStatus;
}
