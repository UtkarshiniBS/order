import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber } from "class-validator";

export class UpdatePiiDetailsDto {

  @IsArray({ message: "attributes# should be array" })
  @IsNotEmpty({ message: "attributes# should not be empty" })
  @ApiProperty({ name: "attributes", type: [String], required: true })
  attributes: string[];

}
