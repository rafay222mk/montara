import { apiClient } from './client';
import { InventoryItem, InventoryTransaction } from '@/types';

export const inventoryApi = {
  items: {
    list: (category?: string, lowStock?: boolean) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (lowStock) params.append('lowStock', 'true');
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get<InventoryItem[]>(`/inventory${query}`);
    },
    get: (id: string) => apiClient.get<InventoryItem>(`/inventory/${id}`),
    create: (dto: Omit<InventoryItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
      apiClient.post<InventoryItem, typeof dto>('/inventory', dto),
    update: (id: string, dto: Partial<Omit<InventoryItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>) =>
      apiClient.patch<InventoryItem, typeof dto>(`/inventory/${id}`, dto),
    delete: (id: string) => apiClient.delete<{ success: boolean }>(`/inventory/${id}`),
    stockIn: (id: string, dto: { quantity: number; reason?: string }) =>
      apiClient.post<InventoryItem, typeof dto>(`/inventory/${id}/stock-in`, dto),
    stockOut: (id: string, dto: { quantity: number; reason?: string }) =>
      apiClient.post<InventoryItem, typeof dto>(`/inventory/${id}/stock-out`, dto),
  },
  transactions: {
    list: (itemId?: string) => {
      const query = itemId ? `?itemId=${itemId}` : '';
      return apiClient.get<InventoryTransaction[]>(`/inventory/transactions${query}`);
    },
  },
};
