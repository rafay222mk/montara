import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
