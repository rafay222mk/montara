import { apiClient, apiPaths } from './client';
import { ApiStudent } from '@/types';

export const studentsApi = {
  list: (params?: { firstName?: string; lastName?: string; admissionNumber?: string; classroomId?: string; isActive?: boolean }) => {
    let path = apiPaths.students;
    if (params) {
      const query = new URLSearchParams();
      if (params.firstName) query.set('firstName', params.firstName);
      if (params.lastName) query.set('lastName', params.lastName);
      if (params.admissionNumber) query.set('admissionNumber', params.admissionNumber);
      if (params.classroomId) query.set('classroomId', params.classroomId);
      if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
      const queryString = query.toString();
      if (queryString) {
        path += `?${queryString}`;
      }
    }
    return apiClient.get<ApiStudent[]>(path);
  },
  
  get: (id: string) => apiClient.get<ApiStudent>(`${apiPaths.students}/${id}`),
  
  create: (body: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    admissionNumber: string;
    enrollmentDate: string;
    classroomId?: string | null;
    parentId?: string | null;
  }) => apiClient.post<ApiStudent, typeof body>(apiPaths.students, body),
  
  update: (id: string, body: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    admissionNumber: string;
    enrollmentDate: string;
    classroomId?: string | null;
    parentId?: string | null;
  }>) => apiClient.patch<ApiStudent, typeof body>(`${apiPaths.students}/${id}`, body),
  
  delete: (id: string) => apiClient.delete<ApiStudent>(`${apiPaths.students}/${id}`),
};
