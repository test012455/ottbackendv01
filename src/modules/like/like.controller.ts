import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';

import { LikeService } from './like.service';

@Controller('likes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  // ⭐ LIKE VIDEO
  @Post(':videoId')
  likeVideo(@Param('videoId') videoId: string, @Req() req: any) {
    return this.likeService.likeVideo(videoId, req.user.id);
  }

  // ⭐ UNLIKE VIDEO
  @Delete(':videoId')
  unlikeVideo(@Param('videoId') videoId: string, @Req() req: any) {
    return this.likeService.unlikeVideo(videoId, req.user.id);
  }

  // ⭐ VIEW ALL LIKES FOR A VIDEO (ANY ROLE)
  @Get(':videoId')
  getLikes(@Param('videoId') videoId: string) {
    return this.likeService.getLikes(videoId);
  }
}
