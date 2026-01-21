import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadVideoDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}