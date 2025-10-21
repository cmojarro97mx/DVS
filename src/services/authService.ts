import { apiService } from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    apiService.setAccessToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    apiService.setAccessToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  logout() {
    apiService.setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!apiService.getAccessToken();
  },
};
