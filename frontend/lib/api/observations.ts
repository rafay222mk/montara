import { apiClient, apiPaths } from './client';
import { ApiObservation } from '@/types';

export const observationsApi = {
  list: (params?: {
    studentId?: string;
    area?: string;
    progress?: string;
    observedAt?: string;
    teacherId?: string;
  }) => {
    let path = apiPaths.observations;
    if (params) {
      const query = new URLSearchParams();
      if (params.studentId) query.set('studentId', params.studentId);
      if (params.area) query.set('area', params.area);
      if (params.progress) query.set('progress', params.progress);
      if (params.observedAt) query.set('observedAt', params.observedAt);
      if (params.teacherId) query.set('teacherId', params.teacherId);
      const queryString = query.toString();
      if (queryString) {
        path += `?${queryString}`;
      }
    }
    return apiClient.get<ApiObservation[]>(path);
  },

  get: (id: string) => apiClient.get<ApiObservation>(`${apiPaths.observations}/${id}`),

  create: (body: {
    studentId: string;
    area: string;
    skill: string;
    notes: string;
    progress: string;
    observedAt: string;
  }) => apiClient.post<ApiObservation, typeof body>(apiPaths.observations, body),

  update: (id: string, body: Partial<{
    studentId: string;
    area: string;
    skill: string;
    notes: string;
    progress: string;
    observedAt: string;
  }>) => apiClient.patch<ApiObservation, typeof body>(`${apiPaths.observations}/${id}`, body),

  delete: (id: string) => apiClient.delete<void>(`${apiPaths.observations}/${id}`),

  summary: (studentId: string) => {
    return apiClient.get<{
      studentId: string;
      student: { id: string; firstName: string; lastName: string };
      totalObservations: number;
      areas: {
        area: string;
        observationCount: number;
        latestProgress: string | null;
        latestObservedAt: string | null;
      }[];
    }>(`${apiPaths.observations}/student/${studentId}/summary`);
  },
};
