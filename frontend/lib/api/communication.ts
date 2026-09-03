import { apiClient } from './client';
import { Announcement } from '@/types';

export const communicationApi = {
  announcements: {
    list: () => apiClient.get<Announcement[]>('/communication/announcements'),
    get: (id: string) => apiClient.get<Announcement>(`/communication/announcements/${id}`),
    create: (dto: Omit<Announcement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'creator' | 'publishedAt'>) =>
      apiClient.post<Announcement, typeof dto>('/communication/announcements', dto),
    update: (id: string, dto: Partial<Omit<Announcement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'creator'>>) =>
      apiClient.patch<Announcement, typeof dto>(`/communication/announcements/${id}`, dto),
    delete: (id: string) => apiClient.delete<{ success: boolean }>(`/communication/announcements/${id}`),
  },
};
