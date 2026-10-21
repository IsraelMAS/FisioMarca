// ─── Sesión en el navegador ─────────────────────────────────────────
// El token vive en localStorage (para la API) y en una cookie (para el proxy).
// La cookie dura lo mismo que el tiempo de inactividad y se renueva con la
// actividad del usuario: si nadie toca la página en MINUTOS_INACTIVIDAD, expira sola.

import type { LoginData } from '@/types';

export const TOKEN_KEY = 'fisiomarca_token';
export const USER_KEY = 'fisiomarca_user';
const ACTIVITY_KEY = 'fisiomarca_ultima_actividad';

// ═══════════════ CONFIGURACIÓN DEL TIEMPO DE SESIÓN ═══════════════
// Minutos sin actividad (mouse, teclado, scroll) antes de cerrar la sesión.
// Para la demo: 3. Para producción se recomienda 12–15.
export const MINUTOS_INACTIVIDAD = 3;
// Segundos antes del cierre en que aparece el aviso "¿Sigues ahí?".
export const SEGUNDOS_AVISO = 60;
// ══════════════════════════════════════════════════════════════════

export const INACTIVIDAD_MS = MINUTOS_INACTIVIDAD * 60 * 1000;
export const AVISO_MS = SEGUNDOS_AVISO * 1000;

export type MotivoCierre = 'inactividad' | 'expirada';

function setCookie(token: string) {
  const seguro = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${INACTIVIDAD_MS / 1000}; SameSite=Strict${seguro}`;
}

export function saveSession(data: LoginData) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  registrarActividad();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

export function registrarActividad() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  setCookie(token);
}

export function msInactivo(): number {
  const ultima = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0);
  return ultima ? Date.now() - ultima : Infinity;
}

// Lee "exp" del JWT (la firma la valida el backend y el proxy)
export function tokenExpirado(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Motivo por el que la sesión guardada ya no sirve, o null si sigue vigente
export function motivoInvalida(): MotivoCierre | 'sin-sesion' | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return 'sin-sesion';
  if (tokenExpirado(token)) return 'expirada';
  if (msInactivo() >= INACTIVIDAD_MS) return 'inactividad';
  return null;
}

export function loadSession(): LoginData | null {
  if (typeof window === 'undefined') return null;
  if (motivoInvalida()) {
    clearSession();
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? '') as LoginData;
  } catch {
    return null;
  }
}

// Solo rutas internas: evita redirecciones a otros sitios (?redirect=https://…)
export function rutaSegura(ruta: string | null | undefined): string | null {
  if (!ruta || !ruta.startsWith('/') || ruta.startsWith('//') || ruta.includes('\\')) return null;
  return ruta;
}

// Cierra sesión sin dejar la página protegida en el historial del navegador
export function irAlLogin(motivo?: MotivoCierre) {
  clearSession();
  window.location.replace(motivo ? `/login?motivo=${motivo}` : '/login');
}
