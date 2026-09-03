import { apiClient } from './client';
import { Employee, LeaveRequest } from '@/types';

export const hrApi = {
  employees: {
    list: (department?: string) => {
      const path = department ? `/hr/employees?department=${department}` : '/hr/employees';
      return apiClient.get<Employee[]>(path);
    },
    get: (id: string) => apiClient.get<Employee>(`/hr/employees/${id}`),
    create: (dto: Omit<Employee, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
      apiClient.post<Employee, typeof dto>('/hr/employees', dto),
    update: (id: string, dto: Partial<Omit<Employee, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>) =>
      apiClient.patch<Employee, typeof dto>(`/hr/employees/${id}`, dto),
    delete: (id: string) => apiClient.delete<{ success: boolean }>(`/hr/employees/${id}`),
    leaveSummary: (id: string) => apiClient.get<Record<string, number>>(`/hr/employees/${id}/leave-summary`),
  },
  leaves: {
    list: () => apiClient.get<LeaveRequest[]>('/hr/leaves'),
    create: (dto: { employeeId: string; leaveType: string; startDate: string; endDate: string; reason?: string }) =>
      apiClient.post<LeaveRequest, typeof dto>('/hr/leaves', dto),
    updateStatus: (id: string, status: string) =>
      apiClient.patch<LeaveRequest, { status: string }>(`/hr/leaves/${id}/status`, { status }),
  },
};
