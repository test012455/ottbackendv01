import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { supabase } from '../../config/supabase';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AlbumService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Upload Album Cover =====
  private async uploadCover(albumId: string, file: Express.Multer.File) {
    const path = `album-covers/${albumId}/${uuid()}.jpg`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_IMAGES!)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    return supabase.storage
      .from(process.env.SUPABASE_BUCKET_IMAGES!)
      .getPublicUrl(path).data.publicUrl;
  }

  // ===== Create Album =====
  async createAlbum(
    dto: { title: string; description?: string },
    user: any,
    file?: Express.Multer.File,
  ) {
    const album = await this.prisma.album.create({
      data: {
        title: dto.title,
        description: dto.description,
        creatorId: user.id,
      },
    });

    if (file) {
      const coverUrl = await this.uploadCover(album.id, file);
      return this.prisma.album.update({
        where: { id: album.id },
        data: { coverUrl },
      });
    }

    return album;
  }

  // ===== Get Album with Playlists =====
  async getAlbum(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: {
        playlists: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!album) throw new NotFoundException('Album not found');

    return album;
  }
}
    