import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FeeStructure } from './entities/fee-structure.entity';
import { StudentFee } from './entities/student-fee.entity';
import { Payment } from './entities/payment.entity';
import { StudentsModule } from '../students/students.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeeStructure, StudentFee, Payment]),
    StudentsModule,
    UsersModule,
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
