import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { Mailer } from '../../utils/mailer';
import { VERIFICATION_CODE_TTL } from '../../config';
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private emailTemplate: Handlebars.TemplateDelegate;
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // 加载邮件模板
    const templatePath = path.join(process.cwd(), 'src/templates/email/verification.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.emailTemplate = Handlebars.compile(templateContent);
  }

  async onModuleInit() {
    this.logger.log('Email service initialized');
    // 测试Redis连接
    // try {
    //   await this.cacheManager.set('test_key', 'test_value', VERIFICATION_CODE_TTL);
    //   const testValue = await this.cacheManager.get('test_key');
    //   if (testValue === 'test_value') {
    //     this.logger.log('Redis connection test successful');
    //   } else {
    //     this.logger.error('Redis connection test failed: value mismatch');
    //   }
    // } catch (error) {
    //   this.logger.error('Redis connection test failed:', error);
    // }
  }

  /**
   * 生成6位随机验证码
   */
  private generateVerificationCode(): string {
    return Math.random().toString().slice(2, 8);
  }

  /**
   * 发送验证码邮件
   * @param email 目标邮箱
   * @returns 生成的验证码
   */
  async sendVerificationCode(email: string): Promise<string> {
    try {
      const code = this.generateVerificationCode();
      const key = `verification_${email}`;
      
      this.logger.log(`Attempting to send verification code to ${email}`);
      this.logger.debug(`Generated code: ${code}`);
      
      // 将验证码保存到Redis，有效期5分钟
      try {
        await this.cacheManager.set(key, code, {
          ttl: VERIFICATION_CODE_TTL
        });
        this.logger.log(`Verification code saved to Redis with key: ${key}`);
        
        // 验证是否成功存储
        const savedCode = await this.cacheManager.get(key);
        if (!savedCode) {
          throw new Error('Failed to save verification code to Redis');
        }
        if (savedCode !== code) {
          throw new Error(`Saved code (${savedCode}) does not match generated code (${code})`);
        }
        this.logger.log('Verification code successfully saved and verified in Redis');
      } catch (error) {
        this.logger.error('Redis operation failed:', error);
        throw new Error('Failed to store verification code');
      }

      // 生成邮件HTML内容
      const html = this.emailTemplate({ code });

      // 发送验证码邮件
      try {
        await Mailer.sendMail({
          from: `"创想集-IdeaBooster" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Idea Booster - 邮箱验证码',
          html
        });
        this.logger.log(`Verification email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send email:`, error);
        await this.cacheManager.del(key); // 如果发送失败，删除缓存的验证码
        throw error;
      }

      return code;
    } catch (error) {
      this.logger.error(`Error in sendVerificationCode:`, error);
      
      if (error.code === 'EAUTH') {
        throw new HttpException(
          '邮件服务认证失败，请检查授权码是否正确',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (error.code === 'ESOCKET') {
        throw new HttpException(
          '邮件服务连接失败，请检查网络',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (error.code === 'ECONNECTION') {
        throw new HttpException(
          '无法连接到邮件服务器',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      throw new HttpException(
        error.message || '发送验证码失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 验证邮箱验证码
   * @param email 邮箱
   * @param code 验证码
   * @returns 是否验证成功
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const key = `verification_${email}`;
      this.logger.debug(`Attempting to verify code for ${email}`);
      
      const savedCode = await this.cacheManager.get(key);
      this.logger.debug(`Saved code: ${savedCode}, Provided code: ${code}`);
      
      if (!savedCode) {
        this.logger.warn(`No verification code found for ${email}`);
        return false;
      }

      const isValid = savedCode === code;
      
      if (isValid) {
        this.logger.log(`Verification successful for ${email}`);
        await this.cacheManager.del(key); // 验证成功后删除验证码
      } else {
        this.logger.warn(`Invalid verification code for ${email}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying code:', error);
      throw new HttpException(
        '验证码验证失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 