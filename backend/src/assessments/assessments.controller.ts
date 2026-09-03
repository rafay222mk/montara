import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentQueryDto } from './dto/assessment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  create(@Body() createAssessmentDto: CreateAssessmentDto, @CurrentUser() user: any) {
    return this.assessmentsService.create(createAssessmentDto, user.tenantId, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findAll(@CurrentUser() user: any, @Query() query: AssessmentQueryDto) {
    return this.assessmentsService.findAll(user.tenantId, query, user);
  }

  @Get('student/:studentId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  studentSummary(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.assessmentsService.studentSummary(studentId, user.tenantId, user);
  }

  @Get('student/:studentId/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  studentProgress(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.assessmentsService.studentProgress(studentId, user.tenantId, user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assessmentsService.findOne(id, user.tenantId, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.update(id, updateAssessmentDto, user.tenantId, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assessmentsService.remove(id, user.tenantId, user);
  }
}
