import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { IsEmail, IsString } from 'class-validator';

class SendVerificationCodeDto {
  @IsEmail()
  email: string;
}

class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-code')
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    try {
      await this.emailService.sendVerificationCode(dto.email);
      return {
        message: '验证码已发送',
        success: true,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('发送验证码失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    const isValid = await this.emailService.verifyCode(dto.email, dto.code);
    if (!isValid) {
      throw new HttpException('验证码无效或已过期', HttpStatus.BAD_REQUEST);
    }
    return {
      message: '验证成功',
      success: true,
    };
  }
} 