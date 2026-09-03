import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmployeeStatus } from './entities/employee.entity';
import { LeaveRequest, LeaveStatus } from './entities/leave-request.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepo: Repository<LeaveRequest>,
  ) {}

  // ── Employee CRUD ──────────────────────────────────────────

  async createEmployee(tenantId: string, dto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.employeeRepo.create({
      ...dto,
      tenantId,
      hireDate: new Date(dto.hireDate),
      userId: dto.userId || null,
    });
    return this.employeeRepo.save(employee);
  }

  async findAllEmployees(tenantId: string, department?: string): Promise<Employee[]> {
    const where: any = { tenantId };
    if (department) {
      where.department = department;
    }
    return this.employeeRepo.find({
      where,
      order: { name: 'ASC' },
      relations: ['user'],
    });
  }

  async findOneEmployee(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id, tenantId },
      relations: ['user'],
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async updateEmployee(id: string, tenantId: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOneEmployee(id, tenantId);
    
    if (dto.hireDate) {
      employee.hireDate = new Date(dto.hireDate);
    }
    
    Object.assign(employee, {
      ...dto,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : employee.hireDate,
      userId: dto.userId !== undefined ? (dto.userId || null) : employee.userId,
    });

    return this.employeeRepo.save(employee);
  }

  async removeEmployee(id: string, tenantId: string): Promise<{ success: boolean }> {
    const employee = await this.findOneEmployee(id, tenantId);
    // Soft deactivation instead of hard delete to keep audit history clean
    employee.status = EmployeeStatus.INACTIVE;
    await this.employeeRepo.save(employee);
    return { success: true };
  }

  // ── Leave Request Operations ────────────────────────────────

  async createLeaveRequest(tenantId: string, dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const employee = await this.employeeRepo.findOne({
      where: { id: dto.employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${dto.employeeId} not found`);
    }

    const leave = this.leaveRequestRepo.create({
      ...dto,
      tenantId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: LeaveStatus.PENDING,
    });
    return this.leaveRequestRepo.save(leave);
  }

  async findAllLeaveRequests(tenantId: string): Promise<LeaveRequest[]> {
    return this.leaveRequestRepo.find({
      where: { tenantId },
      relations: ['employee', 'approver'],
      order: { startDate: 'DESC' },
    });
  }

  async updateLeaveStatus(
    id: string,
    tenantId: string,
    approverId: string,
    dto: UpdateLeaveStatusDto,
  ): Promise<LeaveRequest> {
    const leave = await this.leaveRequestRepo.findOne({
      where: { id, tenantId },
      relations: ['employee'],
    });
    if (!leave) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    leave.status = dto.status;
    leave.approverId = approverId;

    // If leave is approved, we can also update employee status to ON_LEAVE
    if (dto.status === LeaveStatus.APPROVED) {
      const today = new Date();
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      if (today >= start && today <= end) {
        await this.employeeRepo.update(leave.employeeId, { status: EmployeeStatus.ON_LEAVE });
      }
    }

    return this.leaveRequestRepo.save(leave);
  }

  async getLeaveSummary(tenantId: string, employeeId: string) {
    const approvedRequests = await this.leaveRequestRepo.find({
      where: { tenantId, employeeId, status: LeaveStatus.APPROVED },
    });

    const summary = {
      SICK: 0,
      CASUAL: 0,
      ANNUAL: 0,
    };

    for (const req of approvedRequests) {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (req.leaveType in summary) {
        summary[req.leaveType] += diffDays;
      }
    }

    return summary;
  }
}
