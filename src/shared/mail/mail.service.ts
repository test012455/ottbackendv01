import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number.parseInt(process.env.MAIL_PORT || '587'),
      secure: false, // use TLS, not SSL
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,   
      }
    });
  }

  async sendOtp(email: string, otp: string) {
    return this.transporter.sendMail({
      from: `"OTT App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `<h1>${otp}</h1>`,
    });
  }
}
