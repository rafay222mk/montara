import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  create(@Body() createStudentDto: CreateStudentDto, @CurrentUser() user: any) {
    return this.studentsService.create(createStudentDto, user.tenantId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.ACCOUNTANT)
  findAll(
    @CurrentUser() user: any,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('admissionNumber') admissionNumber?: string,
    @Query('classroomId') classroomId?: string,
    @Query('isActive') isActive?: string,
  ) {
    // Convert isActive string to boolean if provided
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    
    // If the authenticated user is a PARENT, restrict search to their own child/children
    const parentId = user.role === UserRole.PARENT ? user.userId : undefined;

    return this.studentsService.findAll(
      user.tenantId,
      { firstName, lastName, admissionNumber, classroomId, isActive: isActiveBool },
      parentId,
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.ACCOUNTANT)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // If the authenticated user is a PARENT, enforce lookup restricted to their child
    const parentId = user.role === UserRole.PARENT ? user.userId : undefined;
    return this.studentsService.findOne(id, user.tenantId, parentId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.update(id, updateStudentDto, user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.remove(id, user.tenantId);
  }
}
