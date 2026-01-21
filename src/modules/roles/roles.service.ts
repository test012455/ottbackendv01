import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class RolesService {
  constructor(
    private  readonly prisma: PrismaService,
    private  readonly authService: AuthService,
  ) {}

  getAllRoles(): Role[] {
    return Object.values(Role);
  }

  // Assign role and generate fresh tokens
  async assignRole(userId: string, role: Role, req?: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    if (!user) throw new NotFoundException('User not found');

    const meta = req ? { ip: req.ip, ua: req.get?.('user-agent') || req.headers?.['user-agent'] } : undefined;
    const tokens = await this.authService.generateTokenAfterRoleChange(userId, meta);

    return {
      message: `Role assigned: ${role}`,
      user,
      tokens,    
    }; 
  }

    // Update role and generate fresh tokens
    async updateUserRole(userId: string, role: Role, req?: any) {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
      });
  
      if (!user) throw new NotFoundException('User not found');
  
      const meta = req ? { ip: req.ip, ua: req.get?.('user-agent') || req.headers?.['user-agent'] } : undefined;
      const tokens = await this.authService.generateTokenAfterRoleChange(userId, meta);
  
      return {
        message: `Role updated: ${role}`,
        user,
        tokens,
      };
    }
  }
