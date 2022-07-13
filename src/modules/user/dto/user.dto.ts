import { IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id: number;

  @IsString({ message: 'username# should be string'})
  @MinLength(3, { message: 'username# should be min 3 char'})
  @MaxLength(50, { message: 'username# must be max 50 char'})
  @IsNotEmpty({ message: 'username# should not be empty'})
  username: string;

  @MinLength(6, { message: 'password# should be min 6 char'})
  @MaxLength(50, { message: 'password# must be max 50 char'})
  @IsNotEmpty({ message: 'password# should not be empty'})
  @IsString({ message: 'password# should be string'})
  @ApiProperty({ minLength: 6 })
  password: string;
}
