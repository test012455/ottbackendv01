import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlaylistService } from './playlist.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@Controller('playlists') // ✅ plural (recommended)
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  // ================= CREATE PLAYLIST =================
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  createPlaylist(
    @Body()
    body: {
      title: string;
      description?: string;
      albumId?: string; // 👈 IMPORTANT
    },
    @UploadedFile() cover: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.playlistService.createPlaylist(
      body,
      req.user,
      cover,
    );
  }

  // ================= ADD VIDEO =================
  @UseGuards(JwtAuthGuard)
  @Post(':id/add-video')
  addVideo(
    @Param('id') playlistId: string,
    @Body('videoId') videoId: string,
    @Req() req: any,
  ) {
    return this.playlistService.addVideoToPlaylist(
      playlistId,
      videoId,
      req.user,
    );
  }

  // ================= GET PLAYLIST (PUBLIC) =================
  @Get(':id')
  getPlaylist(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.playlistService.getPlaylist(id, req.user);
  }

  // ================= REMOVE VIDEO =================
  @UseGuards(JwtAuthGuard)
  @Delete('remove-video/:playlistVideoId')
  removeVideo(
    @Param('playlistVideoId') id: string,
    @Req() req: any,
  ) {
    return this.playlistService.removeVideo(id, req.user);
  }

  // ================= GET SINGLE VIDEO FROM PLAYLIST =================
  @Get(':playlistId/video/:videoId')
  getPlaylistVideo(
    @Param('playlistId') playlistId: string,
    @Param('videoId') videoId: string,
    @Req() req: any,
  ) {
    return this.playlistService.getPlaylistVideo(
      playlistId,
      videoId,
      req.user,
    );
  }
}
