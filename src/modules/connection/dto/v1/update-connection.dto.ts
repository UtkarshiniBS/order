import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform, Type } from "class-transformer";
import {  CreateConnectionV1Dto } from './create-connection.dto';
import { ConnectionState, OrderStatus } from '../../connection.service';

export class UpdateConnectionV1Dto extends PartialType(CreateConnectionV1Dto) {
    @IsString({ message: 'amazonId# should be string'})
    @IsNotEmpty({ message: 'amazonId# should not be empty'})
    @Transform((amazonId) => amazonId.value.toLowerCase())
    @ApiProperty()
    amazonId: string;
  
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