import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement, AnnouncementAudience } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = this.announcementRepo.create({
      ...dto,
      tenantId,
      createdBy: userId,
      publishedAt: dto.isPublished !== false ? new Date() : null,
      isPublished: dto.isPublished !== false,
    });
    return this.announcementRepo.save(announcement);
  }

  async findAll(tenantId: string, user: any): Promise<Announcement[]> {
    const query = this.announcementRepo.createQueryBuilder('ann')
      .leftJoinAndSelect('ann.creator', 'creator')
      .where('ann.tenantId = :tenantId', { tenantId });

    const isAdmin = [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
      UserRole.HR_MANAGER,
      UserRole.INVENTORY_MANAGER,
    ].includes(user.role);

    if (!isAdmin) {
      query.andWhere('ann.isPublished = true');

      if (user.role === UserRole.TEACHER) {
        query.andWhere('ann.audience IN (:...audiences)', {
          audiences: [AnnouncementAudience.ALL, AnnouncementAudience.TEACHERS],
        });
      } else if (user.role === UserRole.PARENT) {
        query.andWhere('ann.audience IN (:...audiences)', {
          audiences: [AnnouncementAudience.ALL, AnnouncementAudience.PARENTS],
        });
      } else {
        query.andWhere('ann.audience = :audience', { audience: AnnouncementAudience.ALL });
      }
    }

    query.orderBy('ann.publishedAt', 'DESC').addOrderBy('ann.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Announcement> {
    const announcement = await this.announcementRepo.findOne({
      where: { id, tenantId },
      relations: ['creator'],
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }
    return announcement;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.findOne(id, tenantId);

    if (dto.isPublished !== undefined) {
      if (dto.isPublished && !announcement.isPublished) {
        announcement.publishedAt = new Date();
      } else if (!dto.isPublished) {
        announcement.publishedAt = null;
      }
    }

    Object.assign(announcement, dto);
    return this.announcementRepo.save(announcement);
  }

  async remove(id: string, tenantId: string): Promise<{ success: boolean }> {
    const announcement = await this.findOne(id, tenantId);
    await this.announcementRepo.remove(announcement);
    return { success: true };
  }
}
