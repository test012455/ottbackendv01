import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlbumService } from './album.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  createAlbum(
    @Body() dto: { title: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.albumService.createAlbum(dto, req.user, file);
  }

  @Get(':id')
  getAlbum(@Param('id') id: string) {
    return this.albumService.getAlbum(id);
  }
}
