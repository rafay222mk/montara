import { Injectable, ForbiddenException } from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { ObservationsService } from '../observations/observations.service';
import { AssessmentsService } from '../assessments/assessments.service';
import { AttendanceService } from '../attendance/attendance.service';
import { generateHeuristicInsight, StudentDevelopmentInsight } from './heuristic/montessori-insight.engine';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AiService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly observationsService: ObservationsService,
    private readonly assessmentsService: AssessmentsService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async generateInsight(
    studentId: string,
    tenantId: string,
    currentUser: any,
  ): Promise<StudentDevelopmentInsight> {
    // 1. Validate student and tenant isolation
    const student = await this.studentsService.findOne(studentId, tenantId);

    // 2. Validate Parent Ownership if user is a parent
    if (currentUser.role === UserRole.PARENT && student.parentId !== currentUser.userId) {
      throw new ForbiddenException('You do not have access to this student\'s developmental insights');
    }

    // 3. Load observations, assessments, and attendance
    const observations = await this.observationsService.findAll(
      tenantId,
      { studentId },
      currentUser,
    );

    const assessments = await this.assessmentsService.findAll(
      tenantId,
      { studentId },
      currentUser,
    );

    const attendance = await this.attendanceService.findAll(
      tenantId,
      { studentId },
      currentUser.role === UserRole.PARENT ? currentUser.userId : undefined,
    );

    // 4. Check for Gemini Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback mode
      return generateHeuristicInsight(student, observations, assessments, attendance);
    }

    try {
      // Load Google GenAI library dynamically or using standard imports
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Compact student records for prompt efficiency and safety
      const obsSummary = observations.map((o) => ({
        area: o.area,
        skill: o.skill,
        progress: o.progress,
        notes: o.notes,
        observedAt: o.observedAt,
      }));

      const assessSummary = assessments.map((a) => ({
        area: a.area,
        skill: a.skill,
        level: a.level,
        score: a.score,
      }));

      const totalDays = attendance.length;
      const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendanceRate = totalDays > 0 ? (presentCount / totalDays) * 100 : 100;

      const studentPromptText = `
        You are a Montessori Developmental Insights AI. You analyze a student's educational data and generate structured observations.
        Student Profile:
        - Age/Classroom: ${student.dateOfBirth ? 'Age ' + calculateAge(new Date(student.dateOfBirth)) : 'N/A'} in Classroom
        - Attendance rate: ${attendanceRate.toFixed(1)}% (Total days marked: ${totalDays})
        - Observations: ${JSON.stringify(obsSummary.slice(0, 15))}
        - Assessment Scores: ${JSON.stringify(assessSummary.slice(0, 15))}

        Based on the above Montessori observations and assessments, generate a structured insight report.
        You must respond ONLY with a raw JSON object complying with the following schema:
        {
          "summary": "Narrative developmental summary of student focus, classroom rhythms, and growth areas.",
          "strengths": ["List of mapped strengths areas/skills"],
          "areasNeedingAttention": ["List of areas/skills needing repeating three-period lessons"],
          "nextSteps": ["Specific next step prompts for the guide/classroom teacher"],
          "suggestedActivities": [
            {
              "title": "Name of specific Montessori materials/activity",
              "area": "One of: Practical Life, Sensorial, Language, Mathematics, Cultural, Social Emotional",
              "reason": "Why this specific activity fits their current progress level"
            }
          ]
        }
        Do not include any markdown backticks like \`\`\`json or surrounding explanation text. Return pure valid JSON string only.
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: studentPromptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
      let parsedInsight: StudentDevelopmentInsight;

      try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedInsight = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini AI structured JSON response', parseErr, responseText);
        // Fallback on JSON parse error
        return generateHeuristicInsight(student, observations, assessments, attendance);
      }

      // Final schema validation check
      if (
        parsedInsight &&
        typeof parsedInsight.summary === 'string' &&
        Array.isArray(parsedInsight.strengths) &&
        Array.isArray(parsedInsight.areasNeedingAttention) &&
        Array.isArray(parsedInsight.nextSteps) &&
        Array.isArray(parsedInsight.suggestedActivities)
      ) {
        return parsedInsight;
      }

      return generateHeuristicInsight(student, observations, assessments, attendance);
    } catch (apiErr) {
      console.error('Gemini API call failed, falling back to Montessori Heuristic engine', apiErr);
      return generateHeuristicInsight(student, observations, assessments, attendance);
    }
  }
}

function calculateAge(dob: Date): number {
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
