import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { MontessoriArea } from '../../observations/enums/montessori-area.enum';

export class CreateLessonDto {
  @IsEnum(MontessoriArea)
  @IsNotEmpty()
  area: MontessoriArea;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ageGroup?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  sequence?: number;

  @IsString()
  @IsOptional()
  materialsNeeded?: string;
}
