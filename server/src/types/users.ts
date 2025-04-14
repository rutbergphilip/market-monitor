export type UserType = {
  id: string;
  username: string;
  email?: string;
  password: string;
  role: string;
  avatarUrl?: string;
  created_at: string;
  updated_at: string;
};

export type UserResponse = Omit<UserType, 'password'>;
