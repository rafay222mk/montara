import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MontessoriArea } from '../enums/montessori-area.enum';
import { ObservationProgress } from '../enums/observation-progress.enum';

export class CreateObservationDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(MontessoriArea)
  @IsNotEmpty()
  area: MontessoriArea;

  @IsString()
  @IsNotEmpty()
  skill: string;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsEnum(ObservationProgress)
  @IsNotEmpty()
  progress: ObservationProgress;

  @IsDateString()
  @IsNotEmpty()
  observedAt: string;
}
