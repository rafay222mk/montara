import { apiClient, apiPaths } from './client';
import { User } from '@/types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiClient.post<LoginResponse, typeof body>(`${apiPaths.auth}/login`, body),
  me: () => apiClient.get<User>(`${apiPaths.auth}/me`),
};
