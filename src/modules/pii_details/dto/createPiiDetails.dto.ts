import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreatePiiDetailsDto {

  @IsString({ message: "attributes# should be string" })
  @IsNotEmpty({ message: "attributes# should not be empty" })
  @ApiProperty({ name: "attributes", type: "string", required: true })  
  attributes: string;

  @IsString({ message: "status# should be string" })
  @IsNotEmpty({ message: "status# should not be empty" })
  @ApiProperty({ name: "status", type: "boolean", required: true })
  status: boolean;

}
