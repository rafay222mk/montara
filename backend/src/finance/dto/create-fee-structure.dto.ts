import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { FeeFrequency } from '../enums/fee-frequency.enum';

export class CreateFeeStructureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsEnum(FeeFrequency)
  @IsNotEmpty()
  frequency: FeeFrequency;
}
