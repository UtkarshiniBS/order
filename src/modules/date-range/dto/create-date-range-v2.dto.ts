import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import BoolOrNumberOrString from "src/common/validators/bool-or-number.validators";

export class CreateDateRangeV2Dto {

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

    @IsString({ message: 'platformId# should be string'})
    @IsNotEmpty({ message: "platformId# should not be empty" })
    @Transform((platformId) => platformId.value.toLowerCase())
    @ApiProperty({ name: "platformId", type: "string", required: true })
    platformId: string;

    @Type(() => Boolean)
    @IsOptional()
    // @IsType(['boolean', 'number'])
    @BoolOrNumberOrString({message: 'Should be bool or number or string'})
    // @IsBoolean({message: 'forceScrape# should be boolean'})
    @Transform((forceScrape) => {
        const value = forceScrape.obj.forceScrape;
        switch (typeof value) {
            case 'number':
                return + value
            case 'string':
                return value.toLowerCase() === 'yes' ? true :  false
            case 'boolean':
            default:
                return value;
        }
    })
    @ApiProperty()
    forceScrape: Boolean;

}