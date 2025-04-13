export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
}
