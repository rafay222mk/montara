import { apiClient, apiPaths } from './client';
import { ApiFeeStructure, ApiStudentFee, ApiPayment } from '@/types';

export const financeApi = {
  summary: () => {
    return apiClient.get<any>(`${apiPaths.finance}/summary`);
  },
  structures: {
    list: () => {
      return apiClient.get<ApiFeeStructure[]>(`${apiPaths.finance}/fee-structures`);
    },
    create: (dto: { name: string; amount: number; frequency: string; description?: string }) => {
      return apiClient.post<ApiFeeStructure, typeof dto>(`${apiPaths.finance}/fee-structures`, dto);
    },
    delete: (id: string) => {
      return apiClient.delete<any>(`${apiPaths.finance}/fee-structures/${id}`);
    },
  },
  studentFees: {
    list: (params?: { studentId?: string; status?: string; feeStructureId?: string }) => {
      let path = `${apiPaths.finance}/student-fees`;
      if (params) {
        const query = new URLSearchParams();
        if (params.studentId) query.set('studentId', params.studentId);
        if (params.status) query.set('status', params.status);
        if (params.feeStructureId) query.set('feeStructureId', params.feeStructureId);
        const queryString = query.toString();
        if (queryString) {
          path += `?${queryString}`;
        }
      }
      return apiClient.get<ApiStudentFee[]>(path);
    },
    create: (dto: { studentId: string; feeStructureId: string; amount: number; dueDate: string }) => {
      return apiClient.post<ApiStudentFee, typeof dto>(`${apiPaths.finance}/student-fees`, dto);
    },
    delete: (id: string) => {
      return apiClient.delete<any>(`${apiPaths.finance}/student-fees/${id}`);
    },
  },
  payments: {
    list: (params?: { studentId?: string; studentFeeId?: string; paymentMethod?: string }) => {
      let path = `${apiPaths.finance}/payments`;
      if (params) {
        const query = new URLSearchParams();
        if (params.studentId) query.set('studentId', params.studentId);
        if (params.studentFeeId) query.set('studentFeeId', params.studentFeeId);
        if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
        const queryString = query.toString();
        if (queryString) {
          path += `?${queryString}`;
        }
      }
      return apiClient.get<ApiPayment[]>(path);
    },
    create: (dto: {
      studentId: string;
      studentFeeId: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    }) => {
      return apiClient.post<ApiPayment, typeof dto>(`${apiPaths.finance}/payments`, dto);
    },
    delete: (id: string) => {
      return apiClient.delete<any>(`${apiPaths.finance}/payments/${id}`);
    },
  },
  studentBalance: (studentId: string) => {
    return apiClient.get<{
      studentId: string;
      totalAssigned: number;
      totalPaid: number;
      outstandingBalance: number;
      overdueAmount: number;
    }>(`${apiPaths.finance}/students/${studentId}/balance`);
  },
};
