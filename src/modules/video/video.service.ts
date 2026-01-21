import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { supabase } from '../../config/supabase';
import { v4 as uuid } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as fs from 'node:fs';
import * as path from 'node:path';

ffmpeg.setFfmpegPath(ffmpegPath as string);

@Injectable()
export class VideoService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------- SUPABASE UPLOAD -------------------
  private async uploadToSupabase(bucket: string, buffer: Buffer, mimeType: string, filePath: string) {
    const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) throw new Error(error.message);
    return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
  }

  // ------------------- FFMPEG CONVERT -------------------
  private convert(input: string, output: string, height: number) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(input)
        .videoCodec('libx264')
        .size(`?x${height}`)
        .on('end', () => resolve())
        .on('error', reject)
        .save(output);
    });
  }

  // ------------------- GENERATE HLS -------------------
  private async generateHls(input: string, outputDir: string) {
    fs.mkdirSync(outputDir, { recursive: true });
    return new Promise<void>((resolve, reject) => {
      ffmpeg(input)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls',
        ])
        .output(path.join(outputDir, 'index.m3u8'))
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  // ------------------- UPLOAD VIDEO -------------------
  async uploadVideo(data: { title: string; description?: string; file: Express.Multer.File }, user: any) {
    const video = await this.prisma.video.create({
      data: {
        title: data.title,
        description: data.description,
        creatorId: user.id,
        status: 'processing',
        videoUrl: '',
      },
    });

    const tmpDir = `tmp/${video.id}`;
    fs.mkdirSync(tmpDir, { recursive: true });
    const original = path.join(tmpDir, 'original.mp4');
    fs.writeFileSync(original, data.file.buffer);

    const qualities = [
      { h: 360, key: 'video360Url' },
      { h: 480, key: 'video480Url' },
      { h: 720, key: 'video720Url' },
      { h: 1080, key: 'video1080Url' },
    ];

    const urls: Record<string, string> = {};
    for (const q of qualities) {
      const out = path.join(tmpDir, `${q.h}.mp4`);
      await this.convert(original, out, q.h);

      urls[q.key] = await this.uploadToSupabase(
        'videos',
        fs.readFileSync(out),
        'video/mp4',
        `${video.id}/${q.h}p.mp4`,
      );
    }

    const hlsDir = path.join(tmpDir, 'hls');
    await this.generateHls(original, hlsDir);
    for (const file of fs.readdirSync(hlsDir)) {
      await this.uploadToSupabase(
        'videos',
        fs.readFileSync(path.join(hlsDir, file)),
        'application/vnd.apple.mpegurl',
        `${video.id}/hls/${file}`,
      );
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });

    return this.prisma.video.update({
      where: { id: video.id },
      data: { ...urls, status: 'ready' },
    });
  }

  // ------------------- UPLOAD THUMBNAIL -------------------
  async uploadThumbnail(id: string, file: Express.Multer.File, user: any) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');
    if (video.creatorId !== user.id) throw new ForbiddenException();

    const thumbnailUrl = await this.uploadToSupabase(
      'images',
      file.buffer,
      file.mimetype,
      `thumbnails/${id}/${uuid()}.jpg`,
    );

    return this.prisma.video.update({
      where: { id },
      data: { thumbnailUrl },
    });
  }

  // ------------------- UPDATE VIDEO -------------------
  async updateVideo(id: string, dto: { title?: string; description?: string }, user: any) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');

    if (video.creatorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to update this video');
    }

    return this.prisma.video.update({
      where: { id },
      data: { title: dto.title ?? video.title, description: dto.description ?? video.description },
    });
  }

  // ------------------- ADMIN APPROVE -------------------
  async approveVideo(videoId: string, admin: any) {
    if (admin?.role !== 'ADMIN') throw new ForbiddenException('Only admin can approve');
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    return this.prisma.video.update({
      where: { id: videoId },
      data: { status: 'approved' },
    });
  }

  // ------------------- SECURE STREAM -------------------
  async getSecureStream(videoId: string, user: any, quality = '720p') {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');
    if (video.status !== 'ready') throw new ForbiddenException('Video not ready');

    const qualityMap: any = {
      '360p': video.video360Url,
      '480p': video.video480Url,
      '720p': video.video720Url,
      '1080p': video.video1080Url,
    };

    return { url: qualityMap[quality] || video.video720Url, token: uuid() };
  }

  // ------------------- COUNT VIEW -------------------
  async markVideoViewed(videoId: string, user: any) {
    const exists = await this.prisma.videoView.findUnique({
      where: { videoId_userId: { videoId, userId: user.id } },
    });

    if (exists) return { message: 'Already counted' };

    await this.prisma.videoView.create({ data: { videoId, userId: user.id } });
    return { message: 'View counted' };
  }

  // ------------------- DOWNLOAD LICENSE -------------------
  async createDownloadLicense(videoId: string, user: any, deviceId: string) {
    if (!deviceId) throw new ForbiddenException('Device ID required');
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const existing = await this.prisma.downloadLicense.findFirst({
      where: { userId: user.id, videoId, deviceId, expiresAt: { gt: new Date() } },
    });
    if (existing) return existing;

    return this.prisma.downloadLicense.create({
      data: { userId: user.id, videoId, deviceId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
  }

// ------------------- GET VIDEO DETAILS -------------------
async getVideoDetails(videoId: string) {
  const video = await this.prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new NotFoundException('Video not found');

  const totalViews = await this.prisma.videoView.count({
    where: { videoId },
  });

  return {
    ...video,
    totalViews,
  };
}
}