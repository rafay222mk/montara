import { apiClient } from './client';
import { StudentDevelopmentInsight } from '@/types';

export const aiApi = {
  studentInsights: (studentId: string) =>
    apiClient.post<StudentDevelopmentInsight, {}>(`/ai/insights/student/${studentId}`, {}),
};
