import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async getSettings(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
    if (!tenant) {
      throw new NotFoundException(`School workspace settings not found`);
    }
    return tenant;
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateSchoolSettingsDto,
  ): Promise<Tenant> {
    const tenant = await this.getSettings(tenantId);
    this.tenantRepository.merge(tenant, dto);
    return this.tenantRepository.save(tenant);
  }
}
