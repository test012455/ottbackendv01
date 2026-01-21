import { IsString, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class AssignRoleDto {
  @IsString()
  userId: string;

  @IsEnum(Role)
  role: Role;
}
