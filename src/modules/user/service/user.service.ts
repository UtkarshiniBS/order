import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDto } from '../dto/user.dto';
import { CreateUserDto } from '../dto/createUser.dto';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>
  ){}
  
  async create(user: CreateUserDto): Promise<UserDto> { 
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<UserDto[]> {
    return await this.userRepository.find({select:['id','username']});
  }

  async findOne(username: string): Promise<any> {
    return await this.userRepository.findOne({ where: { username } });
  }
}