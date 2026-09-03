import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Observation } from '../observations/entities/observation.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { Student } from '../students/entities/student.entity';
import { StudentsService } from '../students/students.service';
import { ObservationsService } from '../observations/observations.service';
import { AssessmentsService } from '../assessments/assessments.service';
import { FinanceService } from '../finance/finance.service';
import { UserRole } from '../users/enums/user-role.enum';
import { AttendanceStatus } from '../attendance/enums/attendance-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    private readonly studentsService: StudentsService,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    private readonly observationsService: ObservationsService,
    private readonly assessmentsService: AssessmentsService,
    private readonly financeService: FinanceService,
  ) {}

  async getStudentDashboard(studentId: string, tenantId: string, currentUser: any): Promise<any> {
    // 1. Resolve student profile and enforce tenant/parent boundaries
    const parentId = currentUser.role === UserRole.PARENT ? currentUser.userId : undefined;
    const student = await this.studentsService.findOne(studentId, tenantId, parentId);

    // 2. Classroom details
    const classroom = student.classroom
      ? { id: student.classroom.id, name: student.classroom.name }
      : null;

    // 3. Attendance statistics
    const attendanceRecords = await this.attendanceRepository.find({
      where: { studentId },
    });
    const totalRecords = attendanceRecords.length;
    const present = attendanceRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = attendanceRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const late = attendanceRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excused = attendanceRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
    const attendancePercentage = totalRecords > 0
      ? Math.round(((present + late) / totalRecords) * 100)
      : 100;

    // 4. Learning observations & assessments summaries
    const obsSummary = await this.observationsService.studentSummary(studentId, tenantId, currentUser);
    const assessProgress = await this.assessmentsService.studentProgress(studentId, tenantId, currentUser);

    // 5. Recent Observations (latest 5)
    const recentObservations = await this.observationRepository.find({
      where: { studentId },
      order: { observedAt: 'DESC', createdAt: 'DESC' },
      take: 5,
    });

    // 6. Recent Assessments (latest 5)
    const recentAssessments = await this.assessmentRepository.find({
      where: { studentId },
      order: { assessedAt: 'DESC', createdAt: 'DESC' },
      take: 5,
    });

    // 7. Finance summary (explicitly conditional role allowlist)
    let finance: any = null;
    if (
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.SCHOOL_ADMIN ||
      currentUser.role === UserRole.PARENT
    ) {
      const balance = await this.financeService.getStudentBalance(studentId, tenantId, currentUser);
      const recentPayments = await this.financeService.getStudentPayments(
        studentId,
        tenantId,
        {} as any,
        currentUser,
      );

      finance = {
        totalAssigned: balance.totalAssigned,
        totalPaid: balance.totalPaid,
        outstandingBalance: balance.outstandingBalance,
        overdueAmount: balance.overdueAmount,
        recentPayments: recentPayments.slice(0, 5),
      };
    }

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth instanceof Date
          ? student.dateOfBirth.toISOString().split('T')[0]
          : String(student.dateOfBirth),
        gender: student.gender,
        isActive: student.isActive,
      },
      classroom,
      attendance: {
        totalRecords,
        present,
        absent,
        late,
        excused,
        attendancePercentage,
      },
      learning: {
        totalObservations: obsSummary.totalObservations,
        totalAssessments: assessProgress.totalAssessments,
        overallAverageScore: assessProgress.overallAverageScore,
        strongestArea: assessProgress.strongestArea,
        areasNeedingAttention: assessProgress.areasNeedingAttention,
      },
      recentObservations,
      recentAssessments,
      finance,
    };
  }
}
