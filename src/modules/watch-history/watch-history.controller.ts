import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { WatchHistoryService } from './watch-history.service';
import { TrackWatchDto } from './dto/track-watch.dto';

@Controller('watch-history')
@UseGuards(JwtAuthGuard)
export class WatchHistoryController {
  constructor(private readonly service: WatchHistoryService) {}

  @Post('track')
  track(@Req() req, @Body() dto: TrackWatchDto) {
    return this.service.track(
      req.user.id,
      dto.videoId,
      dto.watchedSeconds,
      dto.totalSeconds,
    );
  }

  @Get('continue-watching')
  continueWatching(@Req() req) {
    return this.service.continueWatching(req.user.id);
  }

  @Get()
  history(@Req() req) {
    return this.service.userHistory(req.user.id);
  }
}