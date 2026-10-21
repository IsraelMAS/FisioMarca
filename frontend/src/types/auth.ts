// ─── Tipos de Autenticación ───────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  telefono: string;
  password: string;
  confirmarPassword: string;
}

export interface LoginData {
  token: string;
  tipo: string;
  expiraEn: number;
  nombre: string;
  rol: 'CLIENTE' | 'ADMINISTRADOR';
  clienteId: number;
}

export interface UserProfile {
  id: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  rol: string;
  clienteId: number;
}

// Elemento de GET /usuarios/lista (solo ADMINISTRADOR)
export interface AdminUser {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: 'CLIENTE' | 'ADMINISTRADOR';
  activo: boolean;
  fechaCreacion: string;
  clienteId: number | null;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNueva: string;
  confirmarPassword: string;
}

export interface UpdateProfileRequest {
  nombreCompleto: string;
  telefono: string;
}

// Claims que se extraen del JWT (para el cliente)
export interface JwtPayload {
  sub: string;
  roles: string[];
  usuarioId: number;
  nombre: string;
  clienteId: number;
  iat: number;
  exp: number;
}
