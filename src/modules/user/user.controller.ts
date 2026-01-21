import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Req,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ================= PROFILE =================

  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('profile/update')
  updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  // ================= PROFILE PHOTO =================

  // Upload / Update profile photo
  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('photo', { dest: './uploads/profile' }))
  uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.userService.uploadProfilePhoto(req.user.id, file.path);
  }

  // View profile photo
  @Get('profile/photo')
  async getProfilePhoto(@Req() req, @Res() res: Response) {
    const imagePath = await this.userService.getProfilePhoto(req.user.id);

    const resolvedPath = path.resolve(imagePath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).send('Profile photo not found');
    }

    res.sendFile(resolvedPath);
  }

  // ================= ADMIN =================

  @Get('all')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getUserById(@Param('id') id: string, @Req() req) {
    return this.userService.getUserById(id, req.user);
  }

  @Put('block/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  blockUser(@Param('id') id: string, @Req() req) {
    return this.userService.blockUser(id, req.user);
  }

  @Put('unblock/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  unblockUser(@Param('id') id: string, @Req() req) {
    return this.userService.unblockUser(id, req.user);
  }

  // ================= USER ONLY =================

  @Put('parental-control-toggle')
  @Roles(Role.USER)
  toggleParentalControl(@Req() req) {
    return this.userService.toggleParentalControl(req.user.id);
  }
}
