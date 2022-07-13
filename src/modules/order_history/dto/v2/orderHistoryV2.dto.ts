import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from "class-transformer";

export enum StorageType {
  FILE_SYSTEM = "fileSystem",
  AWS = "aws",
  AZURE = "azure"
}

export class OrderHistoryV2Dto {
  
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id: number;

  @IsString({ message: 'filePath# should be string'})
  @IsNotEmpty({ message: 'filePath# should not be empty'})
  @ApiProperty()
  filePath: string;

  @IsString({ message: 'fileName# should be string'})
  @IsNotEmpty({ message: 'fileName# should not be empty'})
  @ApiProperty()
  fileName: string;

  @IsString({ message: 'panelistId# should be string'})
  @IsNotEmpty({ message: 'panelistId# should not be empty'})
  @ApiProperty()
  panelistId: string;

  @IsString({ message: 'platformId# should be string'})
  @IsNotEmpty({ message: 'platformId# should not be empty'})
  @Transform((platformId) => platformId.value.toLowerCase())
  @ApiProperty()
  platformId: string;

  @IsDate({ message: 'fromDate# should be proper date'})
  @IsNotEmpty({ message: 'fromDate# should not be empty'})
  @ApiProperty()
  fromDate: Date;

  @IsDate({ message: 'toDate# should be proper date'})
  @IsNotEmpty({ message: 'fromDate# should not be empty'})
  @ApiProperty()
  toDate: Date;
}
