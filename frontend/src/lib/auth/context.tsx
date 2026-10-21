'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { authService } from '@/lib/api/auth.service';
import {
  AVISO_MS,
  INACTIVIDAD_MS,
  TOKEN_KEY,
  clearSession,
  irAlLogin,
  loadSession,
  motivoInvalida,
  msInactivo,
  registrarActividad,
  saveSession,
} from '@/lib/auth/session';
import { SessionWarning } from '@/components/auth/session-warning';
import type { LoginData, LoginRequest, RegisterRequest, UserProfile } from '@/types';

// ─── Tipos del contexto ──────────────────────────────────────────────

interface AuthState {
  user: LoginData | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthActions {
  login: (body: LoginRequest) => Promise<LoginData>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const EVENTOS_ACTIVIDAD = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
const CADA_CUANTO_GUARDAR = 15_000;

// ─── Provider ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const ultimoGuardado = useRef(0);

  // Restaurar sesión al montar (descarta tokens vencidos o tras el tiempo de inactividad)
  useEffect(() => {
    const stored = loadSession();
    if (stored) {
      setUser(stored);
      authService
        .getProfile()
        .then(res => setProfile(res.data))
        .catch(() => {
          clearSession();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Control de inactividad mientras haya sesión
  useEffect(() => {
    if (!user) return;

    const alActuar = () => {
      const ahora = Date.now();
      if (ahora - ultimoGuardado.current < CADA_CUANTO_GUARDAR) return;
      ultimoGuardado.current = ahora;
      registrarActividad();
    };
    EVENTOS_ACTIVIDAD.forEach(e => window.addEventListener(e, alActuar, { passive: true }));

    const revisar = () => {
      const motivo = motivoInvalida();
      if (motivo === 'sin-sesion') return irAlLogin();
      if (motivo) return irAlLogin(motivo);
      const restante = INACTIVIDAD_MS - msInactivo();
      setSegundosRestantes(restante <= AVISO_MS ? Math.ceil(restante / 1000) : null);
    };
    const intervalo = setInterval(revisar, 1000);

    // Si se cierra la sesión en otra pestaña, esta también sale
    const alCambiarStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) irAlLogin();
    };
    window.addEventListener('storage', alCambiarStorage);

    return () => {
      EVENTOS_ACTIVIDAD.forEach(e => window.removeEventListener(e, alActuar));
      clearInterval(intervalo);
      window.removeEventListener('storage', alCambiarStorage);
    };
  }, [user]);

  // Botón "atrás": si el navegador restaura una página de su caché, se vuelve a validar
  useEffect(() => {
    const alMostrar = (e: PageTransitionEvent) => {
      if (e.persisted && motivoInvalida()) window.location.reload();
    };
    window.addEventListener('pageshow', alMostrar);
    return () => window.removeEventListener('pageshow', alMostrar);
  }, []);

  const login = useCallback(async (body: LoginRequest): Promise<LoginData> => {
    const res = await authService.login(body);
    const data = res.data;
    saveSession(data);
    setUser(data);
    try {
      const profileRes = await authService.getProfile();
      setProfile(profileRes.data);
    } catch { /* el perfil se cargará después */ }
    return data;
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    await authService.register(body);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setProfile(null);
    irAlLogin();
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await authService.getProfile();
    setProfile(res.data);
  }, []);

  const seguirConectado = useCallback(() => {
    registrarActividad();
    setSegundosRestantes(null);
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'ADMINISTRADOR',
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {user && segundosRestantes !== null && (
        <SessionWarning segundos={segundosRestantes} onContinuar={seguirConectado} onSalir={logout} />
      )}
    </AuthContext.Provider>
  );
}
