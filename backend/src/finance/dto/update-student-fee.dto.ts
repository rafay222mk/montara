import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentFeeDto } from './create-student-fee.dto';

export class UpdateStudentFeeDto extends PartialType(CreateStudentFeeDto) {}
