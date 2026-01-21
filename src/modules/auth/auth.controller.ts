import { Controller, Post, Body, Req, UsePipes, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { SuperAdminRegisterGuard } from '../../common/guard/superadmin-register.guard';
import { Role } from '../../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ---------------- Superadmin registration ----------------
@UseGuards(SuperAdminRegisterGuard)
@Post('superadmin-register')
@UsePipes(new ValidationPipe({ whitelist: true }))
async superadminRegister(@Body() dto: RegisterDto) {
  // Register user (normal method)
  await this.authService.register(dto);

  // Find the created user by email or phone
  const user = await this.authService['prisma'].user.findFirst({
    where: {
      OR: [
        { email: dto.email },
        { phone: dto.phone },
      ],
    },
  });

  if (!user) throw new UnauthorizedException('User creation failed');

  // Update role to SUPERADMIN
  await this.authService['prisma'].user.update({
    where: { id: user.id },  // ✅ use the actual UUID
    data: { role: Role.SUPER_ADMIN, isVerified: true },
  });

  return {
    message: 'Superadmin registered successfully',
    identifier: dto.email ?? dto.phone,
  };
}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  login(@Body() dto: LoginDto) {
    return this.authService.sendLoginOtp(dto);
  }

  @Post('verify')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any) {
    const meta = { ip: req.ip, ua: req.get('user-agent') };
    return this.authService.verifyOtp(dto, meta);
  }

  @Post('refresh-token')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  // Debug endpoint to return the authenticated user (for testing tokens)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return req.user;
  }
} 