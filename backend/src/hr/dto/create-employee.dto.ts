import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
// Note: To avoid circular imports or missing enum types, we reference them directly from entities.
// Wait, we can import them from the employee.entity.ts!
import { EmploymentType as EmpType, EmployeeStatus as EmpStatus } from '../entities/employee.entity';

export class CreateEmployeeDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEnum(EmpType)
  @IsOptional()
  employmentType?: EmpType;

  @IsString()
  @IsNotEmpty()
  hireDate: string; // Will parse to Date in service

  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @IsEnum(EmpStatus)
  @IsOptional()
  status?: EmpStatus;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;
}
