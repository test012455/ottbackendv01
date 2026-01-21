import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LikeService {
  constructor(private readonly prisma: PrismaService) {}

  // ⭐ LIKE A VIDEO
  async likeVideo(videoId: string, userId: string) {
    return this.prisma.like.create({
      data: { videoId, userId },
    });
  }

  // ⭐ UNLIKE A VIDEO
  async unlikeVideo(videoId: string, userId: string) {
    return this.prisma.like.deleteMany({
      where: { videoId, userId },
    });
  }

  // ⭐ GET ALL LIKES FOR A VIDEO (For all roles)
  async getLikes(videoId: string) {
    return this.prisma.like.findMany({
      where: { videoId },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }
}
