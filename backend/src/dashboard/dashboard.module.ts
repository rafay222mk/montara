import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Observation } from '../observations/entities/observation.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { StudentsModule } from '../students/students.module';
import { ObservationsModule } from '../observations/observations.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { FinanceModule } from '../finance/finance.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Observation, Assessment]),
    StudentsModule,
    ObservationsModule,
    AssessmentsModule,
    FinanceModule,
    UsersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
