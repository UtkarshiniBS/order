import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class PiiDetailsDto {
  
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id: number;

  @IsString({ message: "attributes# should be string" })
  @IsNotEmpty({ message: "attributes# should not be empty" })
  @ApiProperty()
  attributes: string;

  @IsString({ message: "status# should be string" })
  @IsNotEmpty({ message: "status# should not be empty" })
  @ApiProperty()
  status: boolean;
}
