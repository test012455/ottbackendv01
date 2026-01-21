import { Controller, Post, Put, Get, Param, Body, UploadedFile, UseInterceptors, UseGuards, Req, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('video')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @Roles(Role.PRODUCER)
  @UseInterceptors(FileInterceptor('video'))
  uploadVideo(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any) {
    return this.videoService.uploadVideo({ title: body.title, description: body.description, file }, req.user);
  }

  @Post('upload-thumbnail/:id')
  @Roles(Role.PRODUCER)
  @UseInterceptors(FileInterceptor('thumbnail'))
  uploadThumbnail(@UploadedFile() file: Express.Multer.File, @Param('id') id: string, @Req() req: any) {
    return this.videoService.uploadThumbnail(id, file, req.user);
  }

  @Put('update/:id')
  updateVideo(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.videoService.updateVideo(id, { title: body.title, description: body.description }, req.user);
  }

  @Post('approve/:id')
  @Roles(Role.ADMIN)
  approveVideo(@Param('id') id: string, @Req() req: any) {
    return this.videoService.approveVideo(id, req.user);
  }

  @Get('secure-stream/:id')
  getSecureStream(@Param('id') id: string, @Query('quality') quality: string, @Req() req: any) {
    return this.videoService.getSecureStream(id, req.user, quality);
  }

  @Post('view/:id')
  markVideoViewed(@Param('id') id: string, @Req() req: any) {
    return this.videoService.markVideoViewed(id, req.user);
  }

  @Post('download/:id')
  downloadVideo(@Param('id') id: string, @Body('deviceId') deviceId: string, @Req() req: any) {
    return this.videoService.createDownloadLicense(id, req.user, deviceId);
  }

  @Get(':id')
  getVideo(@Param('id') id: string) {
    return this.videoService.getVideoDetails(id);
  }
}
