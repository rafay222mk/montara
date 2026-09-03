import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ── Employees ──────────────────────────────────────────────

  @Post('employees')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.HR_MANAGER)
  createEmployee(@CurrentUser() user: any, @Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(user.tenantId, dto);
  }

  @Get('employees')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
  )
  findAllEmployees(
    @CurrentUser() user: any,
    @Query('department') department?: string,
  ) {
    return this.hrService.findAllEmployees(user.tenantId, department);
  }

  @Get('employees/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
  )
  findOneEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneEmployee(id, user.tenantId);
  }

  @Get('employees/:id/leave-summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
  )
  getLeaveSummary(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.getLeaveSummary(user.tenantId, id);
  }

  @Patch('employees/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.HR_MANAGER)
  updateEmployee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.hrService.updateEmployee(id, user.tenantId, dto);
  }

  @Delete('employees/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.HR_MANAGER)
  removeEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.removeEmployee(id, user.tenantId);
  }

  // ── Leave Requests ─────────────────────────────────────────

  @Post('leaves')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
  )
  createLeaveRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.hrService.createLeaveRequest(user.tenantId, dto);
  }

  @Get('leaves')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
  )
  findAllLeaveRequests(@CurrentUser() user: any) {
    return this.hrService.findAllLeaveRequests(user.tenantId);
  }

  @Patch('leaves/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.HR_MANAGER)
  updateLeaveStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.hrService.updateLeaveStatus(
      id,
      user.tenantId,
      user.userId,
      dto,
    );
  }
}
