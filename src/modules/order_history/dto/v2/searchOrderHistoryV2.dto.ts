import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";


export class SearchOrderHistoryV2Dto {

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
  @ApiPropertyOptional()
  @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
    message:`fromDate#  should be proper date`
  })
  fromDate: Date;

  @IsOptional()
  @ApiPropertyOptional()
  @Matches(/([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}$/,{
    message:`toDate# should be proper date`
  })
  toDate: Date;
  
}
