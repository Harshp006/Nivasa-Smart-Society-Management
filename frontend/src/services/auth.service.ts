import api from './api';
import type { User, ApiResponse } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refresh: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await api.post('/auth/refresh');
    if (response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response.data;
  },
};
