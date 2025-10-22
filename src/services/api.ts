const API_BASE_URL = '/api';

class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;

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
    options: RequestInit = {}
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
      // Intentar extraer el mensaje de error del backend
      let errorMessage = 'Error en la solicitud';
      
      try {
        const errorData = await response.json();
        // El backend de NestJS envía errores en el formato { message: string }
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON, usar un mensaje genérico
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      // Si el usuario fue eliminado o su sesión es inválida (401), cerrar sesión automáticamente
      if (response.status === 401) {
        this.handleUnauthorized(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
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
