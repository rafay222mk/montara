import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumLesson } from './entities/curriculum-lesson.entity';
import { LessonPlan } from './entities/lesson-plan.entity';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CurriculumLesson, LessonPlan])],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
