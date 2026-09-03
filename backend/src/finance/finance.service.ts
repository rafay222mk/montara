import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { StudentFee } from './entities/student-fee.entity';
import { Payment } from './entities/payment.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { UpdateStudentFeeDto } from './dto/update-student-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StudentFeeQueryDto } from './dto/student-fee-query.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { StudentsService } from '../students/students.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { FeeStatus } from './enums/fee-status.enum';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(StudentFee)
    private readonly studentFeeRepository: Repository<StudentFee>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
  ) {}

  private getTodayString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ==========================================
  // FEE STRUCTURES
  // ==========================================

  async createFeeStructure(dto: CreateFeeStructureDto, tenantId: string): Promise<FeeStructure> {
    const feeStructure = this.feeStructureRepository.create({
      ...dto,
      tenantId,
      isActive: true,
    });
    return this.feeStructureRepository.save(feeStructure);
  }

  async findAllFeeStructures(tenantId: string): Promise<FeeStructure[]> {
    return this.feeStructureRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOneFeeStructure(id: string, tenantId: string): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({ where: { id } });
    if (!feeStructure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }
    if (feeStructure.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }
    return feeStructure;
  }

  async updateFeeStructure(id: string, dto: UpdateFeeStructureDto, tenantId: string): Promise<FeeStructure> {
    const feeStructure = await this.findOneFeeStructure(id, tenantId);
    this.feeStructureRepository.merge(feeStructure, dto);
    return this.feeStructureRepository.save(feeStructure);
  }

  async deactivateFeeStructure(id: string, tenantId: string): Promise<FeeStructure> {
    const feeStructure = await this.findOneFeeStructure(id, tenantId);
    feeStructure.isActive = false;
    return this.feeStructureRepository.save(feeStructure);
  }

  // ==========================================
  // STUDENT FEES
  // ==========================================

  async createStudentFee(dto: CreateStudentFeeDto, tenantId: string): Promise<StudentFee> {
    // 1. Verify student belongs to authenticated tenant
    await this.studentsService.findOne(dto.studentId, tenantId);

    // 2. Verify fee structure belongs to authenticated tenant
    await this.findOneFeeStructure(dto.feeStructureId, tenantId);

    // 3. Derive initial status
    const todayStr = this.getTodayString();
    const status = dto.dueDate < todayStr ? FeeStatus.OVERDUE : FeeStatus.PENDING;

    const studentFee = this.studentFeeRepository.create({
      ...dto,
      tenantId,
      status,
    });

    return this.studentFeeRepository.save(studentFee);
  }

  async findAllStudentFees(tenantId: string, query: StudentFeeQueryDto, currentUser: any): Promise<StudentFee[]> {
    const qb = this.studentFeeRepository.createQueryBuilder('studentFee')
      .leftJoinAndSelect('studentFee.student', 'student')
      .leftJoinAndSelect('studentFee.feeStructure', 'feeStructure')
      .where('studentFee.tenantId = :tenantId', { tenantId });

    if (currentUser.role === UserRole.PARENT) {
      qb.andWhere('student.parentId = :parentId', { parentId: currentUser.userId });
    }

    if (query.studentId) {
      qb.andWhere('studentFee.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.feeStructureId) {
      qb.andWhere('studentFee.feeStructureId = :feeStructureId', { feeStructureId: query.feeStructureId });
    }
    if (query.status) {
      qb.andWhere('studentFee.status = :status', { status: query.status });
    }
    if (query.dueDate) {
      qb.andWhere('studentFee.dueDate = :dueDate', { dueDate: query.dueDate });
    }
    if (query.fromDate) {
      qb.andWhere('studentFee.dueDate >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('studentFee.dueDate <= :toDate', { toDate: query.toDate });
    }

    return qb.getMany();
  }

  async findOneStudentFee(id: string, tenantId: string, currentUser: any): Promise<StudentFee> {
    const studentFee = await this.studentFeeRepository.findOne({
      where: { id },
      relations: ['student', 'feeStructure'],
    });

    if (!studentFee) {
      throw new NotFoundException(`Student fee record with ID ${id} not found`);
    }

    if (studentFee.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    if (currentUser.role === UserRole.PARENT && studentFee.student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student fee');
    }

    return studentFee;
  }

  async updateStudentFee(id: string, dto: UpdateStudentFeeDto, tenantId: string, currentUser: any): Promise<StudentFee> {
    const studentFee = await this.findOneStudentFee(id, tenantId, currentUser);

    if (dto.studentId && dto.studentId !== studentFee.studentId) {
      await this.studentsService.findOne(dto.studentId, tenantId);
    }
    if (dto.feeStructureId && dto.feeStructureId !== studentFee.feeStructureId) {
      await this.findOneFeeStructure(dto.feeStructureId, tenantId);
    }

    this.studentFeeRepository.merge(studentFee, dto);

    // Recalculate status based on new amount and existing payments
    const payments = await this.paymentRepository.find({ where: { studentFeeId: studentFee.id } });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.round((Number(studentFee.amount) - totalPaid) * 100) / 100;
    
    let newStatus = studentFee.status;
    if (newStatus !== FeeStatus.WAIVED) {
      if (remaining <= 0) {
        newStatus = FeeStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = FeeStatus.PARTIALLY_PAID;
      } else {
        const todayStr = this.getTodayString();
        newStatus = studentFee.dueDate < todayStr ? FeeStatus.OVERDUE : FeeStatus.PENDING;
      }
    }
    studentFee.status = newStatus;

    return this.studentFeeRepository.save(studentFee);
  }

  async removeStudentFee(id: string, tenantId: string, currentUser: any): Promise<void> {
    const studentFee = await this.findOneStudentFee(id, tenantId, currentUser);
    await this.studentFeeRepository.remove(studentFee);
  }

  // ==========================================
  // PAYMENTS
  // ==========================================

  async createPayment(dto: CreatePaymentDto, tenantId: string, receivedById: string): Promise<Payment> {
    return this.paymentRepository.manager.transaction(async (manager) => {
      // 1. Verify student exists and belongs to tenant
      await this.studentsService.findOne(dto.studentId, tenantId);

      // 2. Verify StudentFee exists and belongs to tenant
      const studentFee = await manager.findOne(StudentFee, {
        where: { id: dto.studentFeeId },
      });
      if (!studentFee) {
        throw new NotFoundException(`Student fee record not found`);
      }
      if (studentFee.tenantId !== tenantId) {
        throw new ForbiddenException('Access denied to this tenant resource');
      }
      if (studentFee.studentId !== dto.studentId) {
        throw new BadRequestException('Student fee does not belong to the specified student');
      }

      // 3. Calculate remaining balance
      const payments = await manager.find(Payment, {
        where: { studentFeeId: dto.studentFeeId },
      });
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.round((Number(studentFee.amount) - totalPaid) * 100) / 100;

      // 4. Reject if amount exceeds remaining
      if (dto.amount > remaining) {
        throw new BadRequestException(`Payment amount (${dto.amount}) exceeds remaining balance (${remaining})`);
      }

      // 5. Save payment
      const payment = manager.create(Payment, {
        ...dto,
        tenantId,
        receivedById,
      });
      const savedPayment = await manager.save(payment);

      // 6. Recalculate StudentFee status
      const newTotalPaid = Math.round((totalPaid + dto.amount) * 100) / 100;
      const newRemaining = Math.round((Number(studentFee.amount) - newTotalPaid) * 100) / 100;

      let newStatus: FeeStatus;
      if (newRemaining <= 0) {
        newStatus = FeeStatus.PAID;
      } else if (newTotalPaid > 0) {
        newStatus = FeeStatus.PARTIALLY_PAID;
      } else {
        const todayStr = this.getTodayString();
        newStatus = studentFee.dueDate < todayStr ? FeeStatus.OVERDUE : FeeStatus.PENDING;
      }
      studentFee.status = newStatus;
      await manager.save(studentFee);

      return savedPayment;
    });
  }

  async removePayment(id: string, tenantId: string): Promise<void> {
    return this.paymentRepository.manager.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id },
        relations: ['studentFee'],
      });
      if (!payment) {
        throw new NotFoundException(`Payment record with ID ${id} not found`);
      }
      if (payment.tenantId !== tenantId) {
        throw new ForbiddenException('Access denied to this tenant resource');
      }

      const studentFee = payment.studentFee;

      // Delete payment
      await manager.remove(payment);

      // Recalculate StudentFee status
      const payments = await manager.find(Payment, {
        where: { studentFeeId: studentFee.id },
      });
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.round((Number(studentFee.amount) - totalPaid) * 100) / 100;

      let newStatus: FeeStatus;
      if (remaining <= 0) {
        newStatus = FeeStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = FeeStatus.PARTIALLY_PAID;
      } else {
        const todayStr = this.getTodayString();
        newStatus = studentFee.dueDate < todayStr ? FeeStatus.OVERDUE : FeeStatus.PENDING;
      }
      studentFee.status = newStatus;
      await manager.save(studentFee);
    });
  }

  async findAllPayments(tenantId: string, query: PaymentQueryDto, currentUser: any): Promise<Payment[]> {
    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.studentFee', 'studentFee')
      .leftJoinAndSelect('payment.receivedBy', 'receivedBy')
      .where('payment.tenantId = :tenantId', { tenantId });

    if (currentUser.role === UserRole.PARENT) {
      qb.andWhere('student.parentId = :parentId', { parentId: currentUser.userId });
    }

    if (query.studentId) {
      qb.andWhere('payment.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.studentFeeId) {
      qb.andWhere('payment.studentFeeId = :studentFeeId', { studentFeeId: query.studentFeeId });
    }
    if (query.paymentMethod) {
      qb.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
    }
    if (query.paymentDate) {
      qb.andWhere('payment.paymentDate = :paymentDate', { paymentDate: query.paymentDate });
    }
    if (query.fromDate) {
      qb.andWhere('payment.paymentDate >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('payment.paymentDate <= :toDate', { toDate: query.toDate });
    }

    return qb.getMany();
  }

  async findOnePayment(id: string, tenantId: string, currentUser: any): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['student', 'studentFee', 'receivedBy'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment record with ID ${id} not found`);
    }

    if (payment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    if (currentUser.role === UserRole.PARENT && payment.student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student payment');
    }

    return payment;
  }

  // ==========================================
  // VIEWS & AGGREGATIONS
  // ==========================================

  async getStudentBalance(studentId: string, tenantId: string, currentUser: any): Promise<any> {
    const student = await this.studentsService.findOne(studentId, tenantId);
    if (currentUser.role === UserRole.PARENT && student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student balance record');
    }

    const studentFees = await this.studentFeeRepository.find({ where: { studentId } });
    const payments = await this.paymentRepository.find({ where: { studentId } });

    const totalAssigned = studentFees.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstandingBalance = Math.max(0, Math.round((totalAssigned - totalPaid) * 100) / 100);

    const todayStr = this.getTodayString();
    let overdueAmount = 0;
    for (const fee of studentFees) {
      const feePayments = payments.filter((p) => p.studentFeeId === fee.id);
      const feePaid = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const feeRemaining = Math.max(0, Math.round((Number(fee.amount) - feePaid) * 100) / 100);
      if (feeRemaining > 0 && (fee.status === FeeStatus.OVERDUE || fee.dueDate < todayStr)) {
        overdueAmount = Math.round((overdueAmount + feeRemaining) * 100) / 100;
      }
    }

    return {
      studentId,
      totalAssigned,
      totalPaid,
      outstandingBalance,
      overdueAmount,
    };
  }

  async getStudentPayments(studentId: string, tenantId: string, query: PaymentQueryDto, currentUser: any): Promise<Payment[]> {
    const student = await this.studentsService.findOne(studentId, tenantId);
    if (currentUser.role === UserRole.PARENT && student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student payments history');
    }

    const filterQuery: PaymentQueryDto = {
      ...query,
      studentId,
    };

    return this.findAllPayments(tenantId, filterQuery, currentUser);
  }

  async getFinanceSummary(tenantId: string): Promise<any> {
    const studentFees = await this.studentFeeRepository.find({ where: { tenantId } });
    const payments = await this.paymentRepository.find({ where: { tenantId } });

    const totalAssigned = studentFees.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOutstanding = Math.max(0, Math.round((totalAssigned - totalCollected) * 100) / 100);

    const todayStr = this.getTodayString();
    let totalOverdue = 0;
    for (const fee of studentFees) {
      const feePayments = payments.filter((p) => p.studentFeeId === fee.id);
      const feePaid = feePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const feeRemaining = Math.max(0, Math.round((Number(fee.amount) - feePaid) * 100) / 100);
      if (feeRemaining > 0 && (fee.status === FeeStatus.OVERDUE || fee.dueDate < todayStr)) {
        totalOverdue = Math.round((totalOverdue + feeRemaining) * 100) / 100;
      }
    }

    const pendingCount = studentFees.filter((f) => f.status === FeeStatus.PENDING).length;
    const partiallyPaidCount = studentFees.filter((f) => f.status === FeeStatus.PARTIALLY_PAID).length;
    const paidCount = studentFees.filter((f) => f.status === FeeStatus.PAID).length;
    const overdueCount = studentFees.filter((f) => f.status === FeeStatus.OVERDUE || (f.status !== FeeStatus.PAID && f.dueDate < todayStr)).length;
    const waivedCount = studentFees.filter((f) => f.status === FeeStatus.WAIVED).length;

    return {
      totalAssigned,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      pendingCount,
      partiallyPaidCount,
      paidCount,
      overdueCount,
      waivedCount,
    };
  }
}
