import { apiClient, apiPaths } from './client';
import { ApiAttendanceRecord } from '@/types';

export const attendanceApi = {
  list: (date?: string, classroomId?: string, studentId?: string) => {
    let path = apiPaths.attendance;
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (classroomId) query.set('classroomId', classroomId);
    if (studentId) query.set('studentId', studentId);
    const queryString = query.toString();
    if (queryString) {
      path += `?${queryString}`;
    }
    return apiClient.get<ApiAttendanceRecord[]>(path);
  },

  bulkMark: (body: {
    classroomId: string;
    date: string;
    records: {
      studentId: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      remarks?: string | null;
    }[];
  }) => {
    return apiClient.post<{ message: string; count: number; records: ApiAttendanceRecord[] }, typeof body>(
      `${apiPaths.attendance}/bulk`,
      body
    );
  },
};
