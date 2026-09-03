import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { AssessmentArea } from '../enums/assessment-area.enum';
import { AssessmentLevel } from '../enums/assessment-level.enum';

export class CreateAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AssessmentArea)
  @IsNotEmpty()
  area: AssessmentArea;

  @IsString()
  @IsNotEmpty()
  skill: string;

  @IsEnum(AssessmentLevel)
  @IsNotEmpty()
  level: AssessmentLevel;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsDateString()
  @IsNotEmpty()
  assessedAt: string;
}
