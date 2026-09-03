import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from './entities/classroom.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class ClassroomsService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    private readonly usersService: UsersService,
  ) {}

  async create(createClassroomDto: CreateClassroomDto, tenantId: string): Promise<Classroom> {
    // 1. If teacherId is supplied, validate it
    if (createClassroomDto.teacherId) {
      await this.validateTeacher(createClassroomDto.teacherId, tenantId);
    }

    // 2. Create classroom using tenantId from context
    const classroom = this.classroomRepository.create({
      ...createClassroomDto,
      tenantId,
      isActive: true,
    });

    return this.classroomRepository.save(classroom);
  }

  async findAll(tenantId: string): Promise<Classroom[]> {
    return this.classroomRepository.find({
      where: { tenantId },
      relations: ['teacher'],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Classroom> {
    const classroom = await this.classroomRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    if (classroom.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    return classroom;
  }

  async update(id: string, updateClassroomDto: UpdateClassroomDto, tenantId: string): Promise<Classroom> {
    const classroom = await this.findOne(id, tenantId);

    if (updateClassroomDto.teacherId) {
      await this.validateTeacher(updateClassroomDto.teacherId, tenantId);
    }

    this.classroomRepository.merge(classroom, updateClassroomDto);
    return this.classroomRepository.save(classroom);
  }

  async remove(id: string, tenantId: string): Promise<Classroom> {
    const classroom = await this.findOne(id, tenantId);
    classroom.isActive = false;
    return this.classroomRepository.save(classroom);
  }

  // Reusable helper to validate classroom teacher role and tenant context
  private async validateTeacher(teacherId: string, tenantId: string): Promise<void> {
    const teacher = await this.usersService.findOne(teacherId);
    if (!teacher) {
      throw new BadRequestException('Teacher user not found');
    }

    if (teacher.tenantId !== tenantId) {
      throw new BadRequestException('Teacher must belong to the same tenant');
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException('Assigned user must have the TEACHER role');
    }

    if (!teacher.isActive) {
      throw new BadRequestException('Teacher user account is inactive');
    }
  }
}
