import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ClassroomsService } from '../classrooms/classrooms.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly classroomsService: ClassroomsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createStudentDto: CreateStudentDto, tenantId: string): Promise<Student> {
    // 1. Check composite unique constraint on admissionNumber within the tenant
    const existing = await this.studentRepository.findOne({
      where: {
        tenantId,
        admissionNumber: createStudentDto.admissionNumber,
      },
    });

    if (existing) {
      throw new ConflictException(`Admission number ${createStudentDto.admissionNumber} is already registered in this school`);
    }

    // 2. Validate classroom relationship if provided
    if (createStudentDto.classroomId) {
      const classroom = await this.classroomsService.findOne(createStudentDto.classroomId, tenantId);
      if (!classroom.isActive) {
        throw new BadRequestException('Cannot assign student to an inactive classroom');
      }
    }

    // 3. Validate parent relationship if provided
    if (createStudentDto.parentId) {
      await this.validateParent(createStudentDto.parentId, tenantId);
    }

    // 4. Save student
    const student = this.studentRepository.create({
      ...createStudentDto,
      tenantId,
      isActive: true,
    });

    return this.studentRepository.save(student);
  }

  async findAll(
    tenantId: string,
    filters: {
      firstName?: string;
      lastName?: string;
      admissionNumber?: string;
      classroomId?: string;
      isActive?: boolean;
    },
    parentId?: string,
  ): Promise<Student[]> {
    const query = this.studentRepository.createQueryBuilder('student')
      .leftJoinAndSelect('student.classroom', 'classroom')
      .leftJoinAndSelect('student.parent', 'parent')
      .where('student.tenantId = :tenantId', { tenantId });

    if (parentId) {
      query.andWhere('student.parentId = :parentId', { parentId });
    }

    if (filters.firstName) {
      query.andWhere('student.firstName ILIKE :firstName', { firstName: `%${filters.firstName}%` });
    }

    if (filters.lastName) {
      query.andWhere('student.lastName ILIKE :lastName', { lastName: `%${filters.lastName}%` });
    }

    if (filters.admissionNumber) {
      query.andWhere('student.admissionNumber = :admissionNumber', { admissionNumber: filters.admissionNumber });
    }

    if (filters.classroomId) {
      query.andWhere('student.classroomId = :classroomId', { classroomId: filters.classroomId });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('student.isActive = :isActive', { isActive: filters.isActive });
    }

    return query.getMany();
  }

  async findOne(id: string, tenantId: string, parentId?: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['classroom', 'parent'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    if (student.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    if (parentId && student.parentId !== parentId) {
      throw new ForbiddenException('Access denied to this student record');
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto, tenantId: string): Promise<Student> {
    const student = await this.findOne(id, tenantId);

    // 1. If admission number is updated, check uniqueness within tenant
    if (updateStudentDto.admissionNumber && updateStudentDto.admissionNumber !== student.admissionNumber) {
      const existing = await this.studentRepository.findOne({
        where: {
          tenantId,
          admissionNumber: updateStudentDto.admissionNumber,
        },
      });

      if (existing) {
        throw new ConflictException(`Admission number ${updateStudentDto.admissionNumber} is already registered in this school`);
      }
    }

    // 2. If classroomId is updated, validate it
    if (updateStudentDto.classroomId) {
      const classroom = await this.classroomsService.findOne(updateStudentDto.classroomId, tenantId);
      if (!classroom.isActive) {
        throw new BadRequestException('Cannot assign student to an inactive classroom');
      }
    }

    // 3. If parentId is updated, validate it
    if (updateStudentDto.parentId) {
      await this.validateParent(updateStudentDto.parentId, tenantId);
    }

    this.studentRepository.merge(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async remove(id: string, tenantId: string): Promise<Student> {
    const student = await this.findOne(id, tenantId);
    student.isActive = false;
    return this.studentRepository.save(student);
  }

  // Helper validation for parent context
  private async validateParent(parentId: string, tenantId: string): Promise<void> {
    const parent = await this.usersService.findOne(parentId);
    if (!parent) {
      throw new BadRequestException('Parent user not found');
    }

    if (parent.tenantId !== tenantId) {
      throw new BadRequestException('Parent must belong to the same tenant');
    }

    if (parent.role !== UserRole.PARENT) {
      throw new BadRequestException('Assigned parent must have the PARENT role');
    }

    if (!parent.isActive) {
      throw new BadRequestException('Parent user account is inactive');
    }
  }
}
