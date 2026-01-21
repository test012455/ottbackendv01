import { IsUUID, IsInt, Min } from 'class-validator';

export class TrackWatchDto {
  @IsUUID()
  videoId: string;

  @IsInt()
  @Min(1)
  watchedSeconds: number;

  @IsInt()
  @Min(1)
  totalSeconds: number;
}