// ─── HTTP Client Base — Adapter Pattern ──────────────────────────────
// Todos los microservicios pasan por el Gateway en :8080
// El frontend NUNCA habla directo a un micro.
// Por defecto se usa /gateway (mismo origen; app/gateway/[...ruta]/route.ts lo reenvía al Gateway).

import type { ApiResponse } from '@/types/api';
import { irAlLogin } from '@/lib/auth/session';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || '/gateway';

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fisiomarca_token');
}

function buildHeaders(custom?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...custom,
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// fetch solo lanza TypeError si no hubo respuesta (Gateway caído, red o CORS)
async function enviar(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${GATEWAY_URL}${path}`, init);
  } catch (err) {
    if (init.signal?.aborted) throw err;
    throw new ApiError('No se pudo conectar con el servidor. Verifica que el backend esté levantado (docker compose ps).', 0);
  }
}

async function handleResponse<T>(response: Response, path: string): Promise<ApiResponse<T>> {
  // Token vencido o adulterado: se cierra la sesión (no aplica al propio login)
  if (response.status === 401 && getToken() && !path.startsWith('/auth/')) {
    irAlLogin('expirada');
    throw new ApiError('Tu sesión expiró', 401);
  }
  if (!response.ok) {
    // El backend siempre devuelve ApiResponse incluso en errores
    const errorBody = await response.json().catch(() => ({
      success: false,
      mensaje: `Error ${response.status}: ${response.statusText}`,
      data: null,
    }));
    throw new ApiError(
      errorBody.mensaje || response.statusText,
      response.status,
      errorBody
    );
  }
  return response.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Métodos HTTP ────────────────────────────────────────────────────

export async function apiGet<T>(
  path: string,
  opts?: RequestOptions
): Promise<ApiResponse<T>> {
  const res = await enviar(path, {
    method: 'GET',
    headers: buildHeaders(opts?.headers),
    signal: opts?.signal,
  });
  return handleResponse<T>(res, path);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions
): Promise<ApiResponse<T>> {
  const res = await enviar(path, {
    method: 'POST',
    headers: buildHeaders(opts?.headers),
    body: body ? JSON.stringify(body) : undefined,
    signal: opts?.signal,
  });
  return handleResponse<T>(res, path);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  opts?: RequestOptions
): Promise<ApiResponse<T>> {
  const res = await enviar(path, {
    method: 'PUT',
    headers: buildHeaders(opts?.headers),
    body: body ? JSON.stringify(body) : undefined,
    signal: opts?.signal,
  });
  return handleResponse<T>(res, path);
}

export async function apiDelete<T>(
  path: string,
  opts?: RequestOptions
): Promise<ApiResponse<T>> {
  const res = await enviar(path, {
    method: 'DELETE',
    headers: buildHeaders(opts?.headers),
    signal: opts?.signal,
  });
  return handleResponse<T>(res, path);
}

// ─── Petición SOAP (XML) ────────────────────────────────────────────
export async function apiSoap(
  xmlBody: string,
  opts?: RequestOptions
): Promise<string> {
  const res = await enviar('/ws', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      ...opts?.headers,
    },
    body: xmlBody,
    signal: opts?.signal,
  });
  if (!res.ok) throw new ApiError('SOAP request failed', res.status);
  return res.text();
}
