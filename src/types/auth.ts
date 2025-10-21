export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  avatar?: string;
  organizationId?: string;
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  rfc?: string;
  taxRegime?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  website?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
