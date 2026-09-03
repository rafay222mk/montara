import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AwardBadgeDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  badgeId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
