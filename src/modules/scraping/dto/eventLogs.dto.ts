import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMinSize, IsArray, IsEmpty, IsEnum, IsNotEmpty, isObject, IsObject, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import EmptyOrDate from "src/common/validators/empty-or-date.validators";
import EmptyOrEnum from "src/common/validators/empty-or-enum.validators";
import { ScrappingType } from "src/modules/config/dto/config.dto";

export enum LogsStatusType {
  SUCCESS = "success",
  FAILURE = "fail",
  INFO = "info",
  WARNING = "warning",
}

export enum LogsSectionType {
  CONNECTION = "connection",
  ORDER_UPLOAD = "orderUpload",
  SCRAPING_TRANSITION = "scrapingTransition"
}

export enum DevicePlatform {
  ANDROID = "android",
  IOS = "ios",
}

export enum ScrapingContext {
  FOREGROUND = "foreground",
  BACKGROUND = "background",
  MANUAL = "manual",
  ONLINE = "online"
}

export class EventLogsDto {

  @IsString({ message: 'panelistId# should be string'})
  @IsNotEmpty({ message: 'panelistId# should not be empty'})
  @ApiProperty()
  panelistId: string;

  @IsString({ message: 'platformId# should be string'})
  @IsNotEmpty({ message: 'platformId# should not be empty'})
  @Transform((platformId) => platformId.value.toLowerCase())
  @ApiProperty()
  platformId: string;

  @IsString({ message: 'section# should be string'})
  @IsNotEmpty({ message: 'section# should not be empty'})
  // @Transform((section) => section.value.toLowerCase())
  @IsEnum(LogsSectionType, { message: `section# should be among ${Object.values(LogsSectionType).join(', ')}`})
  @ApiProperty({enum: LogsSectionType})
  section: LogsSectionType;

  @IsString({ message: 'type# should be string'})
  @IsOptional()
  // @Transform((type) => type.value.toLowerCase())
  @ApiProperty()
  type: string;

  @IsString({ message: 'status# should be string'})
  @IsNotEmpty({ message: 'status# should not be empty'})
  @Transform((status) => status.value.toLowerCase())
  @IsEnum(LogsStatusType, { message: `status# should be among ${Object.values(LogsStatusType).join(', ')}`})
  @ApiProperty({enum: LogsStatusType})
  status: LogsStatusType;

  @IsString({ message: 'scrappingType# should be string'})
  @IsOptional()
  @EmptyOrEnum(ScrappingType, {message: `scrappingType# should be empty or among ${Object.values(ScrappingType).join(', ')}`})
  // @Transform((status) => status.value.toLowerCase())
  // @IsEnum(ScrappingType || '', { message: `scrappingType# should be among ${Object.values(ScrappingType).join(', ')}`})
  @ApiProperty({enum: ScrappingType})
  scrappingType: ScrappingType;

  @IsString({ message: 'fromDate# should be string'})
  @IsOptional()
  @EmptyOrDate({ message: 'fromDate# should be empty or proper date format'})
  @ApiProperty({
    example: "dd-mm-yyyy"
  })
  fromDate: Date;

  @IsString({ message: 'toDate# should be string'})
  @IsOptional()
  @ApiProperty({
    example: "dd-mm-yyyy"
  })
  @EmptyOrDate({ message: 'toDate# should be empty or proper date format'})
  toDate: Date;

  @IsOptional()
  @IsString({ message: 'message# should be string'})
  @ApiProperty()
  message: string;

  @IsOptional()
  @IsString({ message: 'url# should be string'})
  @ApiProperty()
  url: string;

  @IsString({ message: 'devicePlatform# should be string'})
  @IsOptional()
  @EmptyOrEnum(DevicePlatform, {message: `devicePlatform# should be empty or among ${Object.values(DevicePlatform).join(', ')}`})
  @ApiProperty({enum: DevicePlatform})
  devicePlatform: DevicePlatform;

  @IsOptional()
  @IsString({ message: 'deviceId# should be string'})
  @ApiProperty()
  deviceId: string;

  @IsString({ message: 'scrapingContext# should be string'})
  @IsOptional()
  @EmptyOrEnum(ScrapingContext, {message: `scrapingContext# should be empty or among ${Object.values(ScrapingContext).join(', ')}`})
  @ApiProperty({enum: ScrapingContext})
  scrapingContext: ScrapingContext;

  @IsOptional()
  @IsString({ message: 'notifyType# should be string'})
  @ApiProperty()
  notifyType: string;

}