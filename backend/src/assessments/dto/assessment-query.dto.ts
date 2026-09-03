import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AssessmentArea } from '../enums/assessment-area.enum';
import { AssessmentLevel } from '../enums/assessment-level.enum';

export class AssessmentQueryDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsEnum(AssessmentArea)
  @IsOptional()
  area?: AssessmentArea;

  @IsEnum(AssessmentLevel)
  @IsOptional()
  level?: AssessmentLevel;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsDateString()
  @IsOptional()
  assessedAt?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}
