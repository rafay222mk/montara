import { IsDateString, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateStudentFeeDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  feeStructureId: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}
