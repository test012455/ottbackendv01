import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class ReplyCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsInt()
  videoId: number;

  @IsNotEmpty()
  @IsInt()
  parentId: number;
}