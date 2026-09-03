import { apiClient } from './client';
import { SchoolSettings } from '@/types';

export const adminApi = {
  getSettings: () => apiClient.get<SchoolSettings>('/admin/settings'),
  updateSettings: (dto: Partial<Omit<SchoolSettings, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>) =>
    apiClient.patch<SchoolSettings, typeof dto>('/admin/settings', dto),
};
