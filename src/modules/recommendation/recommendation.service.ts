import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------- USER BASED ---------------- */
  async recommendedForUser(userId: string, limit = 10) {
    const watchedVideos = await this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: [
        { watchPercent: 'desc' },
        { watchCount: 'desc' },
      ],
      take: 20,
      select: { videoId: true },
    });

    if (watchedVideos.length === 0) {
      return this.trendingVideos(limit);
    }

    const watchedIds = watchedVideos.map(v => v.videoId);

    return this.prisma.video.findMany({
      where: {
        id: { notIn: watchedIds },
        status: 'approved',
      },
      include: {
        likes: true,
        videoViews: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /* ---------------- TRENDING ---------------- */
  async trendingVideos(limit = 10) {
    const videos = await this.prisma.video.findMany({
      where: { status: 'approved' },
      include: {
        _count: {
          select: {
            videoViews: true,
            likes: true,
          },
        },
      },
      orderBy: [
        { videoViews: { _count: 'desc' } },
        { likes: { _count: 'desc' } },
      ],
      take: limit,
    });

    return videos;
  }

  /* ---------------- HOME FEED ---------------- */
  async homeRecommendations(userId: string) {
    const userHistoryCount = await this.prisma.watchHistory.count({
      where: { userId },
    });

    if (userHistoryCount === 0) {
      return {
        recommended: [],
        trending: await this.trendingVideos(15),
      };
    }

    return {
      recommended: await this.recommendedForUser(userId, 10),
      trending: await this.trendingVideos(10),
    };
  }
}