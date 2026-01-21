import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SuperAdminRegisterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();

    const SUPERADMIN_REGISTER_KEY = process.env.SUPERADMIN_REGISTER_KEY;
    const key = req.headers['x-superadmin-register-key'];

    if (!key || key !== SUPERADMIN_REGISTER_KEY) {
      throw new UnauthorizedException('Invalid Superadmin registration key');
    }

    return true;
  }
}