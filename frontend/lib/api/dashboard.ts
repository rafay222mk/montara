import { apiClient, apiPaths } from './client';
import { ApiStudentDashboard } from '@/types';

export const dashboardApi = {
  student: (studentId: string) => apiClient.get<ApiStudentDashboard>(`${apiPaths.dashboard}/students/${studentId}`),
};
