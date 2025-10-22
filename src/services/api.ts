const API_BASE_URL = '/api';

class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  private constructor() {
    this.accessToken = localStorage.getItem('accessToken');
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Error en la solicitud';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
        try {
          await this.refreshAccessToken();
          return this.request<T>(endpoint, options, true);
        } catch (refreshError) {
          this.handleUnauthorized(errorMessage);
          return Promise.reject(new Error(errorMessage));
        }
      }
      
      if (response.status === 401) {
        this.handleUnauthorized(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setAccessToken(data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private handleUnauthorized(errorMessage?: string) {
    // Limpiar tokens y datos de sesión solo si no estamos en login/registro
    // (para permitir que se muestren los errores de autenticación)
    const isAuthPage = window.location.pathname.includes('/login') || 
                       window.location.pathname.includes('/register');
    
    if (!isAuthPage) {
      this.setAccessToken(null);
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    console.log('🔷 API SERVICE - PUT Request');
    console.log('🔷 Endpoint:', endpoint);
    console.log('🔷 Data received:', data);
    console.log('🔷 Stringified body:', JSON.stringify(data));
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = ApiService.getInstance();
export const api = apiService;
