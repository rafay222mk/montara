import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { StudentsModule } from '../students/students.module';
import { ObservationsModule } from '../observations/observations.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [
    StudentsModule,
    ObservationsModule,
    AssessmentsModule,
    AttendanceModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
