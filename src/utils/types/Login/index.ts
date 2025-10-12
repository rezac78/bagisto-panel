export interface Role {
  id: number;
  name: string;
  description: string;
  permission_type: string;
  permissions: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  status: number;
  created_at: string;
  updated_at: string;
  role: Role;
}

export interface LoginResponse {
  data: UserData;
  message: string;
  token: string;
}
