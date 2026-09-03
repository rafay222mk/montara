import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentPoints } from './entities/student-points.entity';
import { Badge } from './entities/badge.entity';
import { StudentBadge } from './entities/student-badge.entity';
import { AwardPointsDto } from './dto/award-points.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(StudentPoints)
    private readonly pointsRepo: Repository<StudentPoints>,
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(StudentBadge)
    private readonly studentBadgeRepo: Repository<StudentBadge>,
  ) {}

  // ── Points ─────────────────────────────────────────────────

  async awardPoints(tenantId: string, awardedById: string, dto: AwardPointsDto): Promise<StudentPoints | null> {
    const record = this.pointsRepo.create({
      tenantId,
      studentId: dto.studentId,
      points: dto.points,
      reason: dto.reason,
      awardedById,
    });
    const saved = await this.pointsRepo.save(record);
    return this.pointsRepo.findOne({
      where: { id: saved.id },
      relations: ['student', 'awardedBy'],
    });
  }

  async listPoints(tenantId: string, studentId?: string): Promise<StudentPoints[]> {
    const query = this.pointsRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.student', 'student')
      .leftJoinAndSelect('p.awardedBy', 'awardedBy')
      .where('p.tenantId = :tenantId', { tenantId });

    if (studentId) {
      query.andWhere('p.studentId = :studentId', { studentId });
    }

    query.orderBy('p.awardedAt', 'DESC');
    return query.getMany();
  }

  async getStudentPointsTotal(tenantId: string, studentId: string): Promise<number> {
    const result = await this.pointsRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.points), 0)', 'total')
      .where('p.tenantId = :tenantId AND p.studentId = :studentId', { tenantId, studentId })
      .getRawOne();
    return parseInt(result?.total || '0', 10);
  }

  async getLeaderboard(tenantId: string, limit = 20): Promise<{ studentId: string; firstName: string; lastName: string; totalPoints: number; badgeCount: number }[]> {
    const pointsRows = await this.pointsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.student', 'student')
      .select(['p.studentId', 'SUM(p.points) as totalPoints', 'student.firstName', 'student.lastName'])
      .where('p.tenantId = :tenantId', { tenantId })
      .groupBy('p.studentId')
      .addGroupBy('student.firstName')
      .addGroupBy('student.lastName')
      .orderBy('totalPoints', 'DESC')
      .limit(limit)
      .getRawMany();

    // Attach badge counts
    const studentIds = pointsRows.map((r) => r.p_studentId || r.studentId);
    const badgeCounts: Record<string, number> = {};
    if (studentIds.length > 0) {
      const badgeRows = await this.studentBadgeRepo
        .createQueryBuilder('sb')
        .select(['sb.studentId', 'COUNT(sb.id) as count'])
        .where('sb.tenantId = :tenantId AND sb.studentId IN (:...ids)', { tenantId, ids: studentIds })
        .groupBy('sb.studentId')
        .getRawMany();
      for (const row of badgeRows) {
        badgeCounts[row.sb_studentId || row.studentId] = parseInt(row.count, 10);
      }
    }

    return pointsRows.map((r) => {
      const sid = r.p_studentId || r.studentId;
      return {
        studentId: sid,
        firstName: r.student_firstName || r.firstName,
        lastName: r.student_lastName || r.lastName,
        totalPoints: parseInt(r.totalPoints || r.totalpoints || '0', 10),
        badgeCount: badgeCounts[sid] || 0,
      };
    });
  }

  async getStudentSummary(tenantId: string, studentId: string) {
    const [totalPoints, history, badges] = await Promise.all([
      this.getStudentPointsTotal(tenantId, studentId),
      this.listPoints(tenantId, studentId),
      this.listStudentBadges(tenantId, studentId),
    ]);
    return { studentId, totalPoints, history, badges };
  }

  // ── Badges ─────────────────────────────────────────────────

  async createBadge(tenantId: string, dto: CreateBadgeDto): Promise<Badge> {
    const badge = this.badgeRepo.create({ ...dto, tenantId });
    return this.badgeRepo.save(badge);
  }

  async listBadges(tenantId: string): Promise<Badge[]> {
    return this.badgeRepo.find({
      where: { tenantId, isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async deleteBadge(id: string, tenantId: string): Promise<{ success: boolean }> {
    const badge = await this.badgeRepo.findOne({ where: { id, tenantId } });
    if (!badge) throw new NotFoundException(`Badge ${id} not found`);
    await this.badgeRepo.remove(badge);
    return { success: true };
  }

  async awardBadge(tenantId: string, awardedById: string, dto: AwardBadgeDto): Promise<StudentBadge | null> {
    const badge = await this.badgeRepo.findOne({ where: { id: dto.badgeId, tenantId } });
    if (!badge) throw new NotFoundException(`Badge ${dto.badgeId} not found`);

    const record = this.studentBadgeRepo.create({
      tenantId,
      studentId: dto.studentId,
      badgeId: dto.badgeId,
      awardedById,
      notes: dto.notes || null,
    });
    const saved = await this.studentBadgeRepo.save(record);
    return this.studentBadgeRepo.findOne({
      where: { id: saved.id },
      relations: ['student', 'badge', 'awardedBy'],
    });
  }

  async listStudentBadges(tenantId: string, studentId: string): Promise<StudentBadge[]> {
    return this.studentBadgeRepo.find({
      where: { tenantId, studentId },
      relations: ['badge', 'awardedBy'],
      order: { awardedAt: 'DESC' },
    });
  }

  async listAllStudentBadges(tenantId: string): Promise<StudentBadge[]> {
    return this.studentBadgeRepo.find({
      where: { tenantId },
      relations: ['student', 'badge', 'awardedBy'],
      order: { awardedAt: 'DESC' },
    });
  }

  async revokeStudentBadge(id: string, tenantId: string): Promise<{ success: boolean }> {
    const sb = await this.studentBadgeRepo.findOne({ where: { id, tenantId } });
    if (!sb) throw new NotFoundException(`Award ${id} not found`);
    await this.studentBadgeRepo.remove(sb);
    return { success: true };
  }
}
