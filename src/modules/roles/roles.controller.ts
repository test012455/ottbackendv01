import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guard/roles.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Get all available roles
  @Get()
  @Roles(Role.SUPER_ADMIN)
  getRoles() {
    return this.rolesService.getAllRoles();
  }

  // Assign a role to a user → returns fresh tokens
  @Post('assign')
  @Roles(Role.SUPER_ADMIN)
  assignRole(@Body() dto: AssignRoleDto, @Req() req) {
    return this.rolesService.assignRole(dto.userId, dto.role, req);
  }

  // Update an existing user's role → returns fresh tokens
  @Put('update/:id')
  @Roles(Role.SUPER_ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body('role') role: Role,
    @Req() req,
  ) {
    return this.rolesService.updateUserRole(id, role, req);
  }

  // Reset a user's role to USER → returns fresh tokens
  @Delete('reset/:id')
  @Roles(Role.SUPER_ADMIN)
  resetRole(@Param('id') id: string, @Req() req) {
    return this.rolesService.updateUserRole(id, Role.USER, req);
  }
}
