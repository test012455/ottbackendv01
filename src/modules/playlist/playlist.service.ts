import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { supabase } from '../../config/supabase';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PlaylistService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= UPLOAD COVER IMAGE =================
  private async uploadCover(
    playlistId: string,
    file: Express.Multer.File,
  ) {
    const path = `playlist-covers/${playlistId}/${uuid()}.jpg`;

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

  // ================= CREATE PLAYLIST (UPDATED) =================
  async createPlaylist(
    dto: {
      title: string;
      description?: string;
      albumId?: string;
    },
    user: any,
    file?: Express.Multer.File,
  ) {
    // ✅ Validate album if albumId is provided
    if (dto.albumId) {
      const album = await this.prisma.album.findUnique({
        where: { id: dto.albumId },
      });

      if (!album) {
        throw new NotFoundException('Album not found');
      }

      // 🔒 Only album creator can add playlists
      if (album.creatorId !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to add playlist to this album',
        );
      }
    }

    const playlist = await this.prisma.playlist.create({
      data: {
        title: dto.title,
        description: dto.description,
        creatorId: user.id,
        albumId: dto.albumId ?? null, // 🔗 LINK TO ALBUM
      },
    });

    if (file) {
      const coverUrl = await this.uploadCover(playlist.id, file);
      return this.prisma.playlist.update({
        where: { id: playlist.id },
        data: { coverUrl },
      });
    }

    return playlist;
  }

  // ================= ADD VIDEO TO PLAYLIST =================
  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    user: any,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.creatorId !== user.id)
      throw new ForbiddenException('Not allowed');

    const exists = await this.prisma.playlistVideo.findFirst({
      where: { playlistId, videoId },
    });

    if (exists)
      throw new ConflictException('Video already in playlist');

    const position =
      (await this.prisma.playlistVideo.count({
        where: { playlistId },
      })) + 1;

    return this.prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId,
        position,
      },
    });
  }

  // ================= GET PLAYLIST =================
  async getPlaylist(id: string, user?: any) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: { position: 'asc' },
          include: { video: true },
        },
      },
    });

    if (!playlist) throw new NotFoundException('Playlist not found');

    const isSubscribed = user?.isSubscribed === true;

    const videos = playlist.videos.map((item) => ({
      id: item.id,
      position: item.position,
      video: item.video,
      locked: item.position > 2 && !isSubscribed,
    }));

    return {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
      albumId: playlist.albumId,
      videos,
    };
  }

  // ================= REMOVE VIDEO =================
  async removeVideo(playlistVideoId: string, user: any) {
    const item = await this.prisma.playlistVideo.findUnique({
      where: { id: playlistVideoId },
      include: { playlist: true },
    });

    if (!item) throw new NotFoundException();
    if (item.playlist.creatorId !== user.id)
      throw new ForbiddenException();

    return this.prisma.playlistVideo.delete({
      where: { id: playlistVideoId },
    });
  }

  // ================= GET SINGLE VIDEO FROM PLAYLIST =================
  async getPlaylistVideo(
    playlistId: string,
    videoId: string,
    user?: any,
  ) {
    const playlistVideo = await this.prisma.playlistVideo.findFirst({
      where: { playlistId, videoId },
      include: { video: true },
    });

    if (!playlistVideo) {
      throw new NotFoundException('Video not found in this playlist');
    }

    if (playlistVideo.position <= 2) {
      return {
        playlistId,
        position: playlistVideo.position,
        locked: false,
        video: playlistVideo.video,
      };
    }

    if (!user?.isSubscribed) {
      throw new ForbiddenException(
        'Subscribe to watch this video',
      );
    }

    return {
      playlistId,
      position: playlistVideo.position,
      locked: false,
      video: playlistVideo.video,
    };
  }
}
