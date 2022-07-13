import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, isObject, IsObject, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import ArrayDistinct from "src/common/validators/array-distinct.validators";
import { OrderDetailsDto } from "../orderDetailsDto.dto";

export class CreateOrdersV1Dto {

  @IsString({ message: 'panelistId# should be string'})
  @IsNotEmpty({ message: 'panelistId# should not be empty'})
  @ApiProperty()
  panelistId: string;

  @IsString({ message: 'amazonId# should be string'})
  @IsNotEmpty({ message: 'amazonId# should not be empty'})
  @Transform((amazonId) => amazonId.value.toLowerCase())
  @ApiProperty()
  amazonId: string;

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