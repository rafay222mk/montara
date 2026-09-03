import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  gender: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  admissionNumber: string;

  @IsDateString()
  @IsNotEmpty()
  enrollmentDate: string;

  @IsUUID()
  @IsOptional()
  classroomId?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
