import { apiClient } from './client';
import { ApiCurriculumLesson, ApiLessonPlan } from '@/types';

export const curriculumApi = {
  lessons: {
    list: (params?: { area?: string; ageGroup?: string; isActive?: boolean; search?: string }) => {
      let path = '/curriculum';
      if (params) {
        const query = new URLSearchParams();
        if (params.area) query.set('area', params.area);
        if (params.ageGroup) query.set('ageGroup', params.ageGroup);
        if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
        if (params.search) query.set('search', params.search);
        const queryString = query.toString();
        if (queryString) {
          path += `?${queryString}`;
        }
      }
      return apiClient.get<ApiCurriculumLesson[]>(path);
    },
    get: (id: string) => apiClient.get<ApiCurriculumLesson>(`/curriculum/${id}`),
    create: (dto: {
      area: string;
      title: string;
      description?: string;
      ageGroup?: string;
      sequence?: number;
      materialsNeeded?: string;
    }) => apiClient.post<ApiCurriculumLesson, typeof dto>('/curriculum', dto),
    update: (
      id: string,
      dto: Partial<{
        area: string;
        title: string;
        description?: string;
        ageGroup?: string;
        sequence?: number;
        materialsNeeded?: string;
        isActive?: boolean;
      }>,
    ) => apiClient.patch<ApiCurriculumLesson, typeof dto>(`/curriculum/${id}`, dto),
    delete: (id: string) => apiClient.delete<any>(`/curriculum/${id}`),
  },

  plans: {
    list: (params?: {
      classroomId?: string;
      studentId?: string;
      teacherId?: string;
      status?: string;
      date?: string;
    }) => {
      let path = '/curriculum/plans/list';
      if (params) {
        const query = new URLSearchParams();
        if (params.classroomId) query.set('classroomId', params.classroomId);
        if (params.studentId) query.set('studentId', params.studentId);
        if (params.teacherId) query.set('teacherId', params.teacherId);
        if (params.status) query.set('status', params.status);
        if (params.date) query.set('date', params.date);
        const queryString = query.toString();
        if (queryString) {
          path += `?${queryString}`;
        }
      }
      return apiClient.get<ApiLessonPlan[]>(path);
    },
    get: (id: string) => apiClient.get<ApiLessonPlan>(`/curriculum/plans/${id}`),
    schedule: (dto: {
      lessonId: string;
      classroomId?: string;
      studentId?: string;
      scheduledDate: string;
      status?: string;
      notes?: string;
    }) => apiClient.post<ApiLessonPlan, typeof dto>('/curriculum/plans/schedule', dto),
    update: (
      id: string,
      dto: Partial<{
        lessonId: string;
        classroomId?: string;
        studentId?: string;
        scheduledDate: string;
        status?: string;
        notes?: string;
      }>,
    ) => apiClient.patch<ApiLessonPlan, typeof dto>(`/curriculum/plans/${id}`, dto),
    delete: (id: string) => apiClient.delete<any>(`/curriculum/plans/${id}`),
  },
};
