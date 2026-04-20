// User model
export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
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
  username: string;
  password: string;
}
