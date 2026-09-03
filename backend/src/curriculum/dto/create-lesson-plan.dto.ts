import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { LessonPlanStatus } from '../enums/lesson-plan-status.enum';

export class CreateLessonPlanDto {
  @IsUUID()
  @IsNotEmpty()
  lessonId: string;

  @IsUUID()
  @IsOptional()
  classroomId?: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @IsEnum(LessonPlanStatus)
  @IsOptional()
  status?: LessonPlanStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
