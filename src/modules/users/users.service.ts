// src/users/users.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';   

import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // 验证邮箱验证码
    const isCodeValid = await this.emailService.verifyCode(
      createUserDto.email,
      createUserDto.verificationCode,
    );

    if (!isCodeValid) {
      throw new HttpException('验证码无效或已过期', HttpStatus.BAD_REQUEST);
    }

    // 检查邮箱是否已注册
    const existingUser = await this.usersRepository.findOne({
      where: { user_email: createUserDto.email },
    });

    if (existingUser) {
      throw new HttpException('邮箱已被注册', HttpStatus.BAD_REQUEST);
    }

    // 创建新用户
    const user = new User();
    user.user_id = uuidv4();
    user.user_email = createUserDto.email;
    user.password = await bcrypt.hash(createUserDto.password, 10);
    user.user_name = createUserDto.nickname || createUserDto.email.split('@')[0];
    user.isEmailVerified = true;
    user.isActive = true;

    // 保存用户
    const savedUser = await this.usersRepository.save(user);

    // 生成JWT token
    const token = this.generateToken(savedUser);

    // 返回用户信息和token
    const { password, ...result } = savedUser;
    return {
      user: result,
      token,
    };
  }

  async login(loginUserDto: LoginUserDto) {
    if (!loginUserDto.email || !loginUserDto.password) {
      throw new HttpException('邮箱或密码不能为空', HttpStatus.BAD_REQUEST);
    }
    // 查找用户
    const user = await this.usersRepository.findOne({
      where: { user_email: loginUserDto.email },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.UNAUTHORIZED);
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpException('密码错误', HttpStatus.UNAUTHORIZED);
    }

    // 生成JWT token
    const token = this.generateToken(user);

    // 返回用户信息和token
    const { password, ...result } = user;
    return {
      user: result,
      token,
    };
  }

  private generateToken(user: User) {
    const payload = { email: user.user_email, uid: user.user_id };
    return this.jwtService.sign(payload);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { user_id: id } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }
    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { user_email: email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update({ user_id: id }, updateData);
    return this.usersRepository.findOne({ where: { user_id: id } });
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete({ user_id: id });
  }
}
