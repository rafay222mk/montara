import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MontessoriArea } from '../enums/montessori-area.enum';
import { ObservationProgress } from '../enums/observation-progress.enum';

export class ObservationQueryDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsEnum(MontessoriArea)
  @IsOptional()
  area?: MontessoriArea;

  @IsEnum(ObservationProgress)
  @IsOptional()
  progress?: ObservationProgress;

  @IsDateString()
  @IsOptional()
  observedAt?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
