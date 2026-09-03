import { apiClient, apiPaths } from './client';
import { ApiClassroom } from '@/types';

export const classroomsApi = {
  list: () => apiClient.get<ApiClassroom[]>(apiPaths.classrooms),
  
  get: (id: string) => apiClient.get<ApiClassroom>(`${apiPaths.classrooms}/${id}`),
  
  create: (body: {
    name: string;
    description?: string | null;
    teacherId?: string | null;
  }) => apiClient.post<ApiClassroom, typeof body>(apiPaths.classrooms, body),
  
  update: (id: string, body: Partial<{
    name: string;
    description?: string | null;
    teacherId?: string | null;
  }>) => apiClient.patch<ApiClassroom, typeof body>(`${apiPaths.classrooms}/${id}`, body),
  
  delete: (id: string) => apiClient.delete<void>(`${apiPaths.classrooms}/${id}`),
};
