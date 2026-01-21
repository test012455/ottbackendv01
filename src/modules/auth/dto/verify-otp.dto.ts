import { IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  identifier: string; // email or phone

  @IsString()
  otp: string;
}
