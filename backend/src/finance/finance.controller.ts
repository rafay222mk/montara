import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { UpdateStudentFeeDto } from './dto/update-student-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StudentFeeQueryDto } from './dto/student-fee-query.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==========================================
  // FEE STRUCTURES
  // ==========================================

  @Post('fee-structures')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  createFeeStructure(@Body() dto: CreateFeeStructureDto, @CurrentUser() user: any) {
    return this.financeService.createFeeStructure(dto, user.tenantId);
  }

  @Get('fee-structures')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  findAllFeeStructures(@CurrentUser() user: any) {
    return this.financeService.findAllFeeStructures(user.tenantId);
  }

  @Get('fee-structures/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  findOneFeeStructure(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.findOneFeeStructure(id, user.tenantId);
  }

  @Patch('fee-structures/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  updateFeeStructure(
    @Param('id') id: string,
    @Body() dto: UpdateFeeStructureDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.updateFeeStructure(id, dto, user.tenantId);
  }

  @Delete('fee-structures/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  deactivateFeeStructure(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.deactivateFeeStructure(id, user.tenantId);
  }

  // ==========================================
  // STUDENT FEES
  // ==========================================

  @Post('student-fees')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  createStudentFee(@Body() dto: CreateStudentFeeDto, @CurrentUser() user: any) {
    return this.financeService.createStudentFee(dto, user.tenantId);
  }

  @Get('student-fees')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT)
  findAllStudentFees(@CurrentUser() user: any, @Query() query: StudentFeeQueryDto) {
    return this.financeService.findAllStudentFees(user.tenantId, query, user);
  }

  @Get('student-fees/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT)
  findOneStudentFee(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.findOneStudentFee(id, user.tenantId, user);
  }

  @Patch('student-fees/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  updateStudentFee(
    @Param('id') id: string,
    @Body() dto: UpdateStudentFeeDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.updateStudentFee(id, dto, user.tenantId, user);
  }

  @Delete('student-fees/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  removeStudentFee(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.removeStudentFee(id, user.tenantId, user);
  }

  // ==========================================
  // PAYMENTS
  // ==========================================

  @Post('payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.financeService.createPayment(dto, user.tenantId, user.userId);
  }

  @Get('payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT)
  findAllPayments(@CurrentUser() user: any, @Query() query: PaymentQueryDto) {
    return this.financeService.findAllPayments(user.tenantId, query, user);
  }

  @Get('payments/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT)
  findOnePayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.findOnePayment(id, user.tenantId, user);
  }

  @Delete('payments/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  removePayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.removePayment(id, user.tenantId);
  }

  // ==========================================
  // STUDENT FINANCIAL VIEWS
  // ==========================================

  @Get('students/:studentId/balance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT)
  getStudentBalance(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.financeService.getStudentBalance(studentId, user.tenantId, user);
  }

  @Get('students/:studentId/payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT)
  getStudentPayments(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
    @Query() query: PaymentQueryDto,
  ) {
    return this.financeService.getStudentPayments(studentId, user.tenantId, query, user);
  }

  // ==========================================
  // TENANT FINANCIAL SUMMARY
  // ==========================================

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  getFinanceSummary(@CurrentUser() user: any) {
    return this.financeService.getFinanceSummary(user.tenantId);
  }
}
