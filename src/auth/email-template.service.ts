import handlebars from 'handlebars';
import { Injectable } from '@nestjs/common';

export type EmailTemplateType = 'email-validation' | 'welcome' | 'reset-password';
export interface EmailContent {
  subject: string;
  message: string;
}
export interface EmailTemplate {
  subject: string;
  messageTemplate: HandlebarsTemplateDelegate;
}

@Injectable()
export class EmailTemplateService {
  private templates: Map<EmailTemplateType, EmailTemplate> = new Map();

  constructor() {
    this.templates.set('email-validation', {
      subject: 'validate email',
      messageTemplate: handlebars.compile(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Validation</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .container {
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        width: 100%;
                        max-width: 600px;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 20px;
                        font-size: 16px;
                        color: #ffffff;
                        background-color: #007bff;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .button:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Email Validation</h1>
                    <p>Hello {{username}},</p>
                    <p>Thank you for registering on our platform. Please click the button below to validate your email address:</p>
                    <a href="{{validationLink}}" class="button">Validate Email</a>
                    <p>If you did not create an account, no further action is required.</p>
                    <p>Best regards,<br>Your Company Name</p>
                </div>
            </body>
            </html>
        `),
    });

    this.templates.set('reset-password', {
      subject: 'Reset Password',
      messageTemplate: handlebars.compile(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 600px;
            text-align: center;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Reset Your Password</h1>
        <p>Hello {{username}},</p>
        <p>We received a request to reset the password for your account. Please click the button below to create a new password:</p>
        <a href="{{resetPasswordLink}}" class="button">Reset Password</a>
        <p>If you did not request this change, please contact our support team immediately. No further action is required if you did not make this request.</p>
        <p>Best regards,<br>Your Company Name</p>
    </div>
</body>
</html>
`)
    })
  }

  get(id: EmailTemplateType, values: { [key: string]: string }): EmailContent {
    const emailTemplate = this.templates.get(id);
    return {
      subject: emailTemplate.subject,
      message: emailTemplate.messageTemplate(values),
    };
  }
}
