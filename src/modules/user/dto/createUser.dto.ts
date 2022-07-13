import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { IsPasswordValid } from '../../../common/utils/password.validator';

export class CreateUserDto {

  @IsString({ message: 'username# should be string'})
  @MinLength(3, { message: 'username# should be min 3 char'})
  @MaxLength(50, { message: 'username# must be max 50 char'})
  @IsNotEmpty({ message: 'username# should not be empty'})
  @Matches(/^[a-zA-Z]+([_-]?[a-zA-Z0-9])*$/, {
    message: `username# accepts only upper and lower case alphanumeric chars and no underscore or hyphen at the start or end`
  }) 
  @ApiProperty()
  username: string;

  @IsPasswordValid({ message: 'password# is too weak'})
  @MinLength(6, { message: 'password# should be min 6 char'})
  @MaxLength(50, { message: 'password# must be max 50 char'})
  @IsNotEmpty({ message: 'password# should not be empty'})
  @IsString({ message: 'password# should be string'})
  @ApiProperty()
  password: string;
}
