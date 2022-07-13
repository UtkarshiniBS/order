import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsNotEmpty, IsString } from "class-validator";


export class CreateDateRangeV1Dto {

    // @ApiProperty({ name: "fromDate", type: "string", required: true })
    // @IsDate({ message: "fromDate# should be proper date" })
    // fromDate: Date;

    // @ApiProperty({ name: "toDate", type: "string", required: true })
    // @IsDate({ message: "fromDate# should be proper date" })
    // fromDate: Date;
    @IsString({ message: 'panelistId# should be string'})
    @IsNotEmpty({ message: "panelistId# should not be empty" })
    @ApiProperty({ name: "panelistId", type: "string", required: true })
    panelistId: string;

    @IsString({ message: 'amazonId# should be string'})
    @IsNotEmpty({ message: "amazonId# should not be empty" })
    @Transform((amazonId) => amazonId.value.toLowerCase())
    @ApiProperty({ name: "amazonId", type: "string", required: true })
    amazonId: string;

}