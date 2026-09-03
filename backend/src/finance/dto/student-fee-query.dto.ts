import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FeeStatus } from '../enums/fee-status.enum';

export class StudentFeeQueryDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  feeStructureId?: string;

  @IsEnum(FeeStatus)
  @IsOptional()
  status?: FeeStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}
