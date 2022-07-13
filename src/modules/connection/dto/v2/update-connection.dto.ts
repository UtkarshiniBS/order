import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform, Type } from "class-transformer";
import { ConnectionState, OrderStatus } from '../../connection.service';
import { CreateConnectionV2Dto } from './create-connection.dto';

export class UpdateConnectionV2Dto extends PartialType(CreateConnectionV2Dto) {
    @IsString({ message: 'platformId# should be string'})
    @IsNotEmpty({ message: 'platformId# should not be empty'})
    @Transform((platformId) => platformId.value.toLowerCase())
    @ApiProperty()
    platformId: string;
  
    @IsString({ message: 'panelistId# should be string'})
    @IsNotEmpty({ message: 'panelistId# should not be empty'})
    @ApiProperty()
    panelistId: string;
    
    @IsEnum(ConnectionState, { message: `status# should be among ${Object.values(ConnectionState).join(', ')}`})
    @ApiProperty({enum: ConnectionState})
    status: ConnectionState;

    @IsOptional()
    @IsString({ message: 'message# should be string'})
    @ApiPropertyOptional()
    message: string;

    @IsOptional()
    @IsEnum(OrderStatus, { message: `orderStatus# should be among ${Object.values(OrderStatus).join(', ')}`})
    @ApiPropertyOptional({enum: OrderStatus})
    orderStatus: OrderStatus;
}