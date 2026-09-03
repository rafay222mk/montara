import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto';
import { StudentsService } from '../students/students.service';
import { ClassroomsService } from '../classrooms/classrooms.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly studentsService: StudentsService,
    private readonly classroomsService: ClassroomsService,
  ) {}

  async mark(createAttendanceDto: CreateAttendanceDto, tenantId: string, markedById: string): Promise<Attendance> {
    const { studentId, classroomId, date } = createAttendanceDto;

    // 1. Validate student belongs to tenantId
    const student = await this.studentsService.findOne(studentId, tenantId);

    // 2. Validate classroom belongs to tenantId
    const classroom = await this.classroomsService.findOne(classroomId, tenantId);

    // 3. Validate student belongs to the classroom
    if (student.classroomId !== classroomId) {
      throw new BadRequestException(`Student ${studentId} does not belong to classroom ${classroomId}`);
    }

    // 4. Perform Upsert
    let attendance = await this.attendanceRepository.findOne({
      where: { studentId, date },
    });

    if (attendance) {
      attendance.status = createAttendanceDto.status;
      attendance.remarks = createAttendanceDto.remarks ?? null;
      attendance.classroomId = classroomId;
      attendance.markedById = markedById;
    } else {
      attendance = this.attendanceRepository.create({
        ...createAttendanceDto,
        tenantId,
        markedById,
      });
    }

    return this.attendanceRepository.save(attendance);
  }

  async bulkMark(bulkMarkAttendanceDto: BulkMarkAttendanceDto, tenantId: string, markedById: string): Promise<any> {
    const { classroomId, date, records } = bulkMarkAttendanceDto;

    // 1. Validate classroom belongs to tenantId
    const classroom = await this.classroomsService.findOne(classroomId, tenantId);
    if (!classroom.isActive) {
      throw new BadRequestException('Cannot mark attendance for an inactive classroom');
    }

    // 2. Pre-validate all student relationships and roles to ensure atomicity
    for (const record of records) {
      const student = await this.studentsService.findOne(record.studentId, tenantId);
      if (student.classroomId !== classroomId) {
        throw new BadRequestException(`Student ${record.studentId} does not belong to classroom ${classroomId}`);
      }
      if (!student.isActive) {
        throw new BadRequestException(`Student ${record.studentId} is currently inactive`);
      }
    }

    // 3. Execute bulk upsert in a database transaction
    return this.attendanceRepository.manager.transaction(async (transactionalEntityManager) => {
      const results: Attendance[] = [];

      for (const record of records) {
        let attendance = await transactionalEntityManager.findOne(Attendance, {
          where: { studentId: record.studentId, date },
        });

        if (attendance) {
          attendance.status = record.status;
          attendance.remarks = record.remarks ?? null;
          attendance.classroomId = classroomId;
          attendance.markedById = markedById;
        } else {
          attendance = transactionalEntityManager.create(Attendance, {
            studentId: record.studentId,
            classroomId,
            date,
            status: record.status,
            remarks: record.remarks ?? null,
            tenantId,
            markedById,
          });
        }

        const saved = await transactionalEntityManager.save(Attendance, attendance);
        results.push(saved);
      }

      return {
        message: 'Bulk attendance marked successfully',
        count: results.length,
        records: results,
      };
    });
  }

  async findAll(
    tenantId: string,
    filters: { classroomId?: string; date?: string; studentId?: string },
    parentId?: string,
  ): Promise<Attendance[]> {
    const query = this.attendanceRepository.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.classroom', 'classroom')
      .leftJoinAndSelect('attendance.markedBy', 'markedBy')
      .where('attendance.tenantId = :tenantId', { tenantId });

    if (parentId) {
      query.andWhere('student.parentId = :parentId', { parentId });
    }

    if (filters.classroomId) {
      query.andWhere('attendance.classroomId = :classroomId', { classroomId: filters.classroomId });
    }

    if (filters.date) {
      query.andWhere('attendance.date = :date', { date: filters.date });
    }

    if (filters.studentId) {
      query.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });
    }

    return query.getMany();
  }

  async findOne(id: string, tenantId: string, parentId?: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['student', 'classroom', 'markedBy'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    if (attendance.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    if (parentId && attendance.student.parentId !== parentId) {
      throw new ForbiddenException('Access denied to this student record');
    }

    return attendance;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto, tenantId: string, markedById: string): Promise<Attendance> {
    const attendance = await this.findOne(id, tenantId);

    const studentId = updateAttendanceDto.studentId ?? attendance.studentId;
    const classroomId = updateAttendanceDto.classroomId ?? attendance.classroomId;
    const date = updateAttendanceDto.date ?? attendance.date;

    // Validate relationships if anything has changed
    if (
      (updateAttendanceDto.studentId && updateAttendanceDto.studentId !== attendance.studentId) ||
      (updateAttendanceDto.classroomId && updateAttendanceDto.classroomId !== attendance.classroomId)
    ) {
      const student = await this.studentsService.findOne(studentId, tenantId);
      const classroom = await this.classroomsService.findOne(classroomId, tenantId);

      if (student.classroomId !== classroomId) {
        throw new BadRequestException(`Student ${studentId} does not belong to classroom ${classroomId}`);
      }
    }

    // Check unique constraint if studentId or date has changed
    if (
      (updateAttendanceDto.studentId && updateAttendanceDto.studentId !== attendance.studentId) ||
      (updateAttendanceDto.date && updateAttendanceDto.date !== attendance.date)
    ) {
      const duplicate = await this.attendanceRepository.findOne({
        where: { studentId, date },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Attendance record for student ${studentId} on ${date} already exists`);
      }
    }

    this.attendanceRepository.merge(attendance, {
      ...updateAttendanceDto,
      markedById,
    });

    return this.attendanceRepository.save(attendance);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const attendance = await this.findOne(id, tenantId);
    await this.attendanceRepository.remove(attendance);
  }
}
