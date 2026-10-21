// ─── AUTH-SERVICE Adapter ────────────────────────────────────────────
// Rutas: /auth/*, /usuarios/*

import { apiGet, apiPost, apiPut } from './client';
import type {
  LoginRequest,
  LoginData,
  RegisterRequest,
  UserProfile,
  AdminUser,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '@/types';

export const authService = {
  login: (body: LoginRequest) =>
    apiPost<LoginData>('/auth/login', body),

  register: (body: RegisterRequest) =>
    apiPost<{ id: number; clienteId: number }>('/auth/register', body),

  getProfile: () =>
    apiGet<UserProfile>('/usuarios/perfil'),

  updateProfile: (body: UpdateProfileRequest) =>
    apiPut<UserProfile>('/usuarios/perfil', body),

  changePassword: (body: ChangePasswordRequest) =>
    apiPut<null>('/usuarios/cambiar-password', body),

  listUsers: () =>
    apiGet<AdminUser[]>('/usuarios/lista'),
};
