import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private  readonly prisma: PrismaService) {}

  // CREATE top-level comment
  async addComment(userId: string, dto: any) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        videoId: dto.videoId,
        userId,
        parentId: null
      }, 
    });
  }

  // CREATE reply to a comment
  async replyComment(userId: string, dto: any) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: dto.parentId },
    });

    if (!parent) throw new NotFoundException('Parent comment not found');

    // Reply must stay inside same video
    if (parent.videoId !== dto.videoId) {
      throw new ForbiddenException('Reply must be inside the same video');
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        videoId: dto.videoId,
        userId,
        parentId: dto.parentId,
      },
    });
  }

  // FETCH all comments (threaded) for a video
  async getThreadedComments(videoId: string) {
    return this.prisma.comment.findMany({
      where: { videoId, parentId: null },
      include: {
        user: true,
        replies: {
          include: {
            user: true,
            replies: {
              include: {
                user: true,
                replies: {
                  include: { user: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // DELETE comment (user only own, admin any)
  async deleteComment(user: any, id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Only owner can delete their comment
    if (user.role === 'USER' || user.role === 'PRODUCER') {
      if (comment.userId !== user.id) {
        throw new ForbiddenException('You cannot delete another user’s comment');
      }
    }

    await this.prisma.comment.delete({
      where: { id }
    });

    return { message: 'Comment deleted successfully' };
  }

  // ADMIN & SUPER ADMIN → all comments
  async adminGetAll() {
    return this.prisma.comment.findMany({
      include: { user: true, video: true }
    });
  }
}