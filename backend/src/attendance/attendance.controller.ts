import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  create(@Body() createAttendanceDto: CreateAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.mark(createAttendanceDto, user.tenantId, user.userId);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  createBulk(@Body() bulkMarkAttendanceDto: BulkMarkAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.bulkMark(bulkMarkAttendanceDto, user.tenantId, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.ACCOUNTANT)
  findAll(
    @CurrentUser() user: any,
    @Query('classroomId') classroomId?: string,
    @Query('date') date?: string,
    @Query('studentId') studentId?: string,
  ) {
    const parentId = user.role === UserRole.PARENT ? user.userId : undefined;
    return this.attendanceService.findAll(user.tenantId, { classroomId, date, studentId }, parentId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.ACCOUNTANT)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const parentId = user.role === UserRole.PARENT ? user.userId : undefined;
    return this.attendanceService.findOne(id, user.tenantId, parentId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.update(id, updateAttendanceDto, user.tenantId, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.attendanceService.remove(id, user.tenantId);
  }
}
