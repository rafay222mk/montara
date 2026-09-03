import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { ObservationQueryDto } from './dto/observation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('observations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  create(@Body() createObservationDto: CreateObservationDto, @CurrentUser() user: any) {
    return this.observationsService.create(createObservationDto, user.tenantId, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findAll(@CurrentUser() user: any, @Query() query: ObservationQueryDto) {
    return this.observationsService.findAll(user.tenantId, query, user);
  }

  @Get('student/:studentId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  studentSummary(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.observationsService.studentSummary(studentId, user.tenantId, user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.observationsService.findOne(id, user.tenantId, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateObservationDto: UpdateObservationDto,
    @CurrentUser() user: any,
  ) {
    return this.observationsService.update(id, updateObservationDto, user.tenantId, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.observationsService.remove(id, user.tenantId, user);
  }
}
