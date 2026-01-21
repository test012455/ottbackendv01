import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  postComment(@Req() req, @Body() dto: CreateCommentDto) {
    return this.commentService.addComment(req.user.id, dto);
  }

  @Post('reply')
  replyComment(@Req() req, @Body() dto: ReplyCommentDto) {
    return this.commentService.replyComment(req.user.id, dto);
  }

  @Get(':videoId')
  getThreadedComments(@Param('videoId') videoId: string) {
    return this.commentService.getThreadedComments(videoId);
  }

  @Delete(':id')
  deleteComment(@Req() req, @Param('id') id: string) {
    return this.commentService.deleteComment(req.user, id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  adminGetAll() {
    return this.commentService.adminGetAll();
  }
}