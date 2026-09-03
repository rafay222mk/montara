import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BadgeCategory } from '../enums/badge-category.enum';

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(BadgeCategory)
  @IsOptional()
  category?: BadgeCategory;
}
