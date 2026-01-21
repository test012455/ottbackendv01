import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { addMinutes, addDays } from 'date-fns';
import { MailService } from '../../shared/mail/mail.service';
import { randomBytes } from 'node:crypto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // ---------------- PASSWORD HASH ----------------
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, await bcrypt.genSalt(10));
  }

  // ---------------- REGISTER ----------------
  async register(dto: any) {
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        password: dto.password ? await this.hashPassword(dto.password) : null,
      },
    });

    return { message: 'User registered', identifier: dto.email ?? dto.phone };
  }

  // ---------------- SUPER ADMIN REGISTER ----------------
  async registerSuperAdmin(dto: any) {
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await this.hashPassword(dto.password),
        role: Role.SUPER_ADMIN,
        isVerified: true,
      },
    });

    return { message: 'Super admin created', id: user.id };
  }

  // ---------------- SEND LOGIN OTP ----------------
  async sendLoginOtp(dto: { email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.verificationToken.create({
      data: {
        identifier: dto.email,
        otp,
        expiresAt: addMinutes(new Date(), 5),
        userId: user.id,
      },
    });

    await this.mail.sendOtp(dto.email, otp);
    return { message: 'OTP sent' };
  }

  // ---------------- VERIFY OTP ----------------
  async verifyOtp(dto: any, meta: any) {
    const record = await this.prisma.verificationToken.findFirst({
      where: { identifier: dto.identifier, otp: dto.otp },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (!record.userId) {
      throw new UnauthorizedException('Invalid token record');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.prisma.session.create({
      data: {
        refreshToken,
        userId: user.id,
        ipAddress: meta.ip,
        userAgent: meta.ua,
        expiresAt: addDays(new Date(), 7),
      },
    });

    return { accessToken, refreshToken, user };
  }

  // ---------------- REFRESH TOKEN ----------------
  async refreshToken(dto: any) {
    const payload = this.jwtService.verify(dto.refreshToken, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    return { accessToken: this.generateAccessToken(user), user };
  }

  // ---------------- LOGOUT ----------------
  async logout(dto: any) {
    await this.prisma.session.deleteMany({
      where: { refreshToken: dto.refreshToken },
    });

    return { message: 'Logged out' };
  }

  // ---------------- FORGOT PASSWORD ----------------
 async forgotPassword(email: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { message: 'If email exists, link sent' };
  }

  const token = randomBytes(32).toString('hex');

  await this.prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: addMinutes(new Date(), 15),
    },
  });

  await this.mail.sendOtp(
    email,
    `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`,
  );

  return { message: 'Reset link sent' };
}


  // ---------------- RESET PASSWORD ----------------
  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: await this.hashPassword(newPassword) },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: record.id },
    });

    return { message: 'Password reset successful' };
  }

  // ---------------- TOKEN HELPERS ----------------
  generateAccessToken(user: any) {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(user: any) {
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  // ---------------- AFTER ROLE CHANGE ----------------
  async generateTokenAfterRoleChange(userId: string, meta?: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    if (meta) {
      await this.prisma.session.create({
        data: {
          refreshToken,
          userId,
          ipAddress: meta.ip,
          userAgent: meta.ua,
          expiresAt: addDays(new Date(), 7),
        },
      });
    }

    return { accessToken, refreshToken, user };
  }
}
