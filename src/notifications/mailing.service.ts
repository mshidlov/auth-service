import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class MailingService {
  private transporter: nodemailer.Transporter;

  constructor(private emailContentService: EmailTemplateService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  sendVerificationEmail(
      email: string,
      username: string,
      validationLink: string,
  ): Promise<void> {
    const emailContent = this.emailContentService.get('email-validation', {
      username,
      validationLink,
    });
    return this.sendEmail(email, emailContent.subject, emailContent.message);
  }


  sendResetPassword(
      email: string,
      username: string,
      resetPasswordPageURL: string,
  ): Promise<void> {
    const emailContent = this.emailContentService.get('reset-password', {
      username,
      resetPasswordPageURL,
    });
    return this.sendEmail(email, emailContent.subject, emailContent.message);
  }

  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      content,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}: ${error}`);
    }
  }
}
