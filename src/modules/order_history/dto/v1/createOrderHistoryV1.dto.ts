import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator";


export class CreateOrderHistoryV1Dto {

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

  @ApiProperty({
    format: 'binary'
  })
  file: string;
}
