import { apiClient, apiPaths } from './client';
import { ApiAssessment } from '@/types';

export const assessmentsApi = {
  list: (params?: {
    studentId?: string;
    area?: string;
    level?: string;
    teacherId?: string;
    assessedAt?: string;
  }) => {
    let path = apiPaths.assessments;
    if (params) {
      const query = new URLSearchParams();
      if (params.studentId) query.set('studentId', params.studentId);
      if (params.area) query.set('area', params.area);
      if (params.level) query.set('level', params.level);
      if (params.teacherId) query.set('teacherId', params.teacherId);
      if (params.assessedAt) query.set('assessedAt', params.assessedAt);
      const queryString = query.toString();
      if (queryString) {
        path += `?${queryString}`;
      }
    }
    return apiClient.get<ApiAssessment[]>(path);
  },

  get: (id: string) => apiClient.get<ApiAssessment>(`${apiPaths.assessments}/${id}`),

  create: (body: {
    studentId: string;
    area: string;
    skill: string;
    level: string;
    score?: number;
    comments?: string;
    assessedAt: string;
  }) => apiClient.post<ApiAssessment, typeof body>(apiPaths.assessments, body),

  update: (id: string, body: Partial<{
    studentId: string;
    area: string;
    skill: string;
    level: string;
    score: number;
    comments: string;
    assessedAt: string;
  }>) => apiClient.patch<ApiAssessment, typeof body>(`${apiPaths.assessments}/${id}`, body),

  delete: (id: string) => apiClient.delete<void>(`${apiPaths.assessments}/${id}`),

  summary: (studentId: string) => {
    return apiClient.get<{
      studentId: string;
      student: { id: string; firstName: string; lastName: string };
      totalAssessments: number;
      areas: {
        area: string;
        assessmentCount: number;
        latestLevel: string | null;
        latestScore: number | null;
        latestAssessedAt: string | null;
      }[];
    }>(`${apiPaths.assessments}/student/${studentId}/summary`);
  },

  progress: (studentId: string) => {
    return apiClient.get<{
      studentId: string;
      totalAssessments: number;
      overallAverageScore: number | null;
      strongestArea: string | null;
      areas: {
        area: string;
        averageScore: number | null;
        latestLevel: string;
        latestScore: number | null;
        latestAssessedAt: string;
      }[];
      areasNeedingAttention: string[];
    }>(`${apiPaths.assessments}/student/${studentId}/progress`);
  },
};
