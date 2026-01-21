import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as fs from 'node:fs';

@Injectable()
export class UserService {
  constructor(private  readonly prisma: PrismaService) {}

  // ================= PROFILE =================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.firstName || dto.lastName
          ? { name: `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim() }
          : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return { message: 'Profile updated successfully', user };
  }

  // ================= PROFILE PHOTO =================

  async uploadProfilePhoto(userId: string, filePath: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // delete old image
    if (user.profileImage && fs.existsSync(user.profileImage)) {
      fs.unlinkSync(user.profileImage);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: filePath },
      select: {
        id: true,
        profileImage: true,
      },
    });
  }

  async getProfilePhoto(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (!user?.profileImage)
      throw new NotFoundException('Profile photo not found');

    return user.profileImage;
  }

  // ================= ADMIN =================

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        parentalControl: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    if (currentUser.role === 'SUPER_ADMIN') return user;

    if (currentUser.role === 'ADMIN' && user.role !== 'USER') {
      throw new ForbiddenException('Admins can only access normal users');
    }

    return user;
  }

  async blockUser(id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    if (currentUser.role === 'ADMIN' && user.role !== 'USER') {
      throw new ForbiddenException('Admins can only block normal users');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'BLOCKED' },
    });

    return { message: 'User blocked successfully' };
  }

  async unblockUser(id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    if (currentUser.role === 'ADMIN' && user.role !== 'USER') {
      throw new ForbiddenException('Admins can only unblock normal users');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return { message: 'User unblocked successfully' };
  }

  async toggleParentalControl(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { parentalControl: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { parentalControl: !user.parentalControl },
      select: { id: true, parentalControl: true },
    });

    return {
      message: `Parental control ${
        updated.parentalControl ? 'enabled' : 'disabled'
      }`,
      user: updated,
    };
  }
}
