import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonDto } from './create-lesson.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
