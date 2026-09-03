import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class AwardPointsDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsInt()
  @Min(1)
  points: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
