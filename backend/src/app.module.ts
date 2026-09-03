import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { StudentsModule } from './students/students.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ObservationsModule } from './observations/observations.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { FinanceModule } from './finance/finance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { GamificationModule } from './gamification/gamification.module';
import { HrModule } from './hr/hr.module';
import { InventoryModule } from './inventory/inventory.module';
import { CommunicationModule } from './communication/communication.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),

    AuthModule,

    UsersModule,

    TenantsModule,

    ClassroomsModule,

    StudentsModule,

    AttendanceModule,

    ObservationsModule,

    AssessmentsModule,

    FinanceModule,

    DashboardModule,

    CurriculumModule,

    GamificationModule,
    
    HrModule,
    
    InventoryModule,
    
    CommunicationModule,

    AdminModule,

    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}