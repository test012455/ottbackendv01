import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WatchHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async track(userId: string, videoId: string, watched: number, total: number) {
    const percent = (watched / total) * 100;
    const completed = percent >= 90;

    /* ---------- RESUME (VideoProgress) ---------- */
    await this.prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {
        position: watched,
      },
      create: {
        userId,
        videoId,
        position: watched,
      },
    });

    /* ---------- WATCH HISTORY ---------- */
    const history = await this.prisma.watchHistory.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });

    if (history) {
      return this.prisma.watchHistory.update({
        where: { id: history.id },
        data: {
          watchSeconds: watched,
          totalSeconds: total,
          watchPercent: percent,
          isCompleted: completed,
          lastWatchedAt: new Date(),
        },
      });
    }

    return this.prisma.watchHistory.create({
      data: {
        userId,
        videoId,
        watchSeconds: watched,
        totalSeconds: total,
        watchPercent: percent,
        isCompleted: completed,
      },
    });
  }

  /* -------- CONTINUE WATCHING -------- */
  async continueWatching(userId: string) {
    return this.prisma.videoProgress.findMany({
      where: { userId },
      include: { video: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /* -------- FULL WATCH HISTORY -------- */
  async userHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: { video: true },
      orderBy: { lastWatchedAt: 'desc' },
    });
  }
}