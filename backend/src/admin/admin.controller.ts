import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getSettings(@CurrentUser() user: any) {
    return this.adminService.getSettings(user.tenantId);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateSchoolSettingsDto,
  ) {
    return this.adminService.updateSettings(user.tenantId, dto);
  }
}
