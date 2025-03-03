import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

export class Mailer {
  private static transporter: nodemailer.Transporter;
  private static readonly logger = new Logger('Mailer');

  static async createTransporter() {
    try {
      // 创建 Nodemailer 传输器
      this.transporter = nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        pool: true, // 使用连接池
        maxConnections: 3,
        maxMessages: 100
      });

      // 验证连接配置
      await this.transporter.verify();
      this.logger.log('邮件服务连接成功');
      return this.transporter;
    } catch (error) {
      this.logger.error('邮件服务连接失败:', error);
      throw error;
    }
  }

  static async sendMail(options: nodemailer.SendMailOptions) {
    try {
      if (!this.transporter) {
        await this.createTransporter();
      }

      // 确保发件人地址正确
      if (!options.from) {
        options.from = process.env.EMAIL_USER;
      }

      this.logger.debug('准备发送邮件:', {
        to: options.to,
        subject: options.subject,
        hasAuth: !!process.env.EMAIL_PASS
      });

      const info = await this.transporter.sendMail(options);
      this.logger.log(`邮件发送成功: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('邮件发送失败:', {
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      throw error;
    }
  }
} 