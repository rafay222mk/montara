import { apiClient } from './client';
import { ApiBadge, ApiStudentPoints, ApiStudentBadge, ApiLeaderboardEntry, ApiStudentGamificationSummary } from '@/types';

export const gamificationApi = {
  points: {
    award: (dto: { studentId: string; points: number; reason: string }) =>
      apiClient.post<ApiStudentPoints, typeof dto>('/gamification/points/award', dto),

    list: (studentId?: string) => {
      const path = studentId
        ? `/gamification/points?studentId=${studentId}`
        : '/gamification/points';
      return apiClient.get<ApiStudentPoints[]>(path);
    },

    leaderboard: (limit = 20) =>
      apiClient.get<ApiLeaderboardEntry[]>(`/gamification/points/leaderboard?limit=${limit}`),

    studentSummary: (studentId: string) =>
      apiClient.get<ApiStudentGamificationSummary>(`/gamification/points/student/${studentId}`),
  },

  badges: {
    list: () => apiClient.get<ApiBadge[]>('/gamification/badges'),

    create: (dto: { name: string; description?: string; icon?: string; category?: string }) =>
      apiClient.post<ApiBadge, typeof dto>('/gamification/badges', dto),

    delete: (id: string) => apiClient.delete<any>(`/gamification/badges/${id}`),

    award: (dto: { studentId: string; badgeId: string; notes?: string }) =>
      apiClient.post<ApiStudentBadge, typeof dto>('/gamification/badges/award', dto),

    studentBadges: (studentId: string) =>
      apiClient.get<ApiStudentBadge[]>(`/gamification/badges/student/${studentId}`),

    allStudentBadges: () =>
      apiClient.get<ApiStudentBadge[]>('/gamification/badges/all'),

    revokeAward: (id: string) =>
      apiClient.delete<any>(`/gamification/badges/award/${id}`),
  },
};
