import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationController {
  constructor(private readonly commsService: CommunicationService) {}

  @Post('announcements')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.INVENTORY_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
  )
  create(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    return this.commsService.create(user.tenantId, user.userId, dto);
  }

  @Get('announcements')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.INVENTORY_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findAll(@CurrentUser() user: any) {
    return this.commsService.findAll(user.tenantId, user);
  }

  @Get('announcements/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.INVENTORY_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commsService.findOne(id, user.tenantId);
  }

  @Patch('announcements/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.INVENTORY_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
  )
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.commsService.update(id, user.tenantId, dto);
  }

  @Delete('announcements/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.INVENTORY_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
  )
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commsService.remove(id, user.tenantId);
  }
}
