import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // If you want password based login too:
  @IsOptional()
  @IsString()
  password?: string;
}
