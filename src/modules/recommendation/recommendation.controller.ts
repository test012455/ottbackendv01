import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private  readonly service: RecommendationService) {}

  @Get('for-you')
  forYou(@Req() req) {
    return this.service.recommendedForUser(req.user.id);
  }

  @Get('trending')
  trending() {
    return this.service.trendingVideos();
  }

  @Get('home')
  home(@Req() req) {
    return this.service.homeRecommendations(req.user.id);
  }
}