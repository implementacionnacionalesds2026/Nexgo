// User model
export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  role: 'ADMIN' | 'SMALL_CUSTOMER' | 'AVERAGE_CUSTOMER' | 'FULL_CUSTOMER' | 'REPARTIDOR' | 'GESTOR_ADMINISTRATIVO';
  role_id?: number;
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
