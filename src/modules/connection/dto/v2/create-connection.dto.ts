import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsOptional, Matches, IsInt, IsEnum, IsString, IsNotEmpty, isEnum } from "class-validator";
import { ConnectionState, OrderStatus } from "../../connection.service";

export class CreateConnectionV2Dto {
    @IsString({ message: 'platformId# should be string'})
    @IsNotEmpty({ message: 'platformId# should not be empty'})
    @Transform((platformId) => platformId.value.toLowerCase())
    @ApiProperty()
    platformId: string;
  
    @IsString({ message: 'panelistId# should be string'})
    @IsNotEmpty({ message: 'panelistId# should not be empty'})
    @ApiProperty()
    panelistId: string;

    @IsOptional()
    @IsEnum(ConnectionState, { message: `status# should be ${ConnectionState.NEVER_CONNECTED}`})
    @ApiPropertyOptional({enum: ConnectionState})
    status: ConnectionState;

    @IsOptional()
    @IsString({ message: 'message# should be string'})
    @IsNotEmpty({ message: 'message# should not be empty'})
    @ApiPropertyOptional()
    message: string;

    @IsOptional()
    @IsEnum(OrderStatus, { message: `orderStatus# should be among ${Object.values(OrderStatus)}`})
    @ApiPropertyOptional({enum: OrderStatus})
    orderStatus: OrderStatus;
}