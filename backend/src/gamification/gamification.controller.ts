import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ── Points ─────────────────────────────────────────────────

  @Post('points/award')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  awardPoints(@CurrentUser() user: any, @Body() dto: AwardPointsDto) {
    return this.gamificationService.awardPoints(user.tenantId, user.userId, dto);
  }

  @Get('points')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  listPoints(@CurrentUser() user: any, @Query('studentId') studentId?: string) {
    return this.gamificationService.listPoints(user.tenantId, studentId);
  }

  @Get('points/leaderboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  getLeaderboard(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.gamificationService.getLeaderboard(user.tenantId, limit ? parseInt(limit) : 20);
  }

  @Get('points/student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  getStudentSummary(@CurrentUser() user: any, @Param('studentId') studentId: string) {
    return this.gamificationService.getStudentSummary(user.tenantId, studentId);
  }

  // ── Badges ─────────────────────────────────────────────────

  @Post('badges')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  createBadge(@CurrentUser() user: any, @Body() dto: CreateBadgeDto) {
    return this.gamificationService.createBadge(user.tenantId, dto);
  }

  @Get('badges')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  listBadges(@CurrentUser() user: any) {
    return this.gamificationService.listBadges(user.tenantId);
  }

  @Delete('badges/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  deleteBadge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gamificationService.deleteBadge(id, user.tenantId);
  }

  @Post('badges/award')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  awardBadge(@CurrentUser() user: any, @Body() dto: AwardBadgeDto) {
    return this.gamificationService.awardBadge(user.tenantId, user.userId, dto);
  }

  @Get('badges/student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  getStudentBadges(@CurrentUser() user: any, @Param('studentId') studentId: string) {
    return this.gamificationService.listStudentBadges(user.tenantId, studentId);
  }

  @Get('badges/all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  listAllStudentBadges(@CurrentUser() user: any) {
    return this.gamificationService.listAllStudentBadges(user.tenantId);
  }

  @Delete('badges/award/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  revokeStudentBadge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.gamificationService.revokeStudentBadge(id, user.tenantId);
  }
}
