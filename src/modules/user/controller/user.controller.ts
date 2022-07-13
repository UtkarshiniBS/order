import { Controller, Get, HttpCode, HttpStatus, Logger, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Body, Req } from '@nestjs/common/decorators/http/route-params.decorator';

import { UserDto } from '../dto/user.dto';
import { CreateUserDto } from '../dto/createUser.dto';
import { UserService } from '../service/user.service';
import { LocalAuthGuard } from '../../../common/guard/local-auth.guard';

import { AuthService } from '../../auth/service/auth.service';
import { CommonModule } from '../../../common/module/common-module';
import * as bcrypt from 'bcrypt';
import { DynamicAuthGuard } from '../../../common/guard/dynamic-auth.guard';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ){}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async login(@Body() user: CreateUserDto) {
    const response = await this.authService.login(user);
    return CommonModule.FormatResponse(HttpStatus.OK, 'User loggedin successfully!', response);
  }

  // @UseGuards(DynamicAuthGuard)
  // @ApiBearerAuth('token')
  // @ApiBearerAuth('panelist_id')
  @ApiHeader({
    name: 'accesstoken',
    description: 'access token',
  })
  @ApiExcludeEndpoint()
  @Put('create')
  async create(@Body() user: CreateUserDto): Promise<UserDto> {
    const checkUsername = await this.userService.findOne(user.username);
    if(checkUsername) {
      return CommonModule.FormatErrorResponse(HttpStatus.OK, 'Username already exist!', null);
    }
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
    const data = await this.userService.create(user);
    const response = { username: data.username, id: data.id };
    return CommonModule.FormatResponse(HttpStatus.OK, 'User created successfully!', response);
  }

  @UseGuards(DynamicAuthGuard)
  @ApiBearerAuth('token')
  @ApiBearerAuth('panelist_id')
  @ApiExcludeEndpoint()
  @Get('list')
  async findAll(@Req() req): Promise<UserDto[]> {
    const response = await this.userService.findAll();
    return CommonModule.FormatResponse(HttpStatus.OK, 'Users fetched successfully!', response); 
  }
}
