// User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENTE' | 'REPARTIDOR';
  companyName?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}
