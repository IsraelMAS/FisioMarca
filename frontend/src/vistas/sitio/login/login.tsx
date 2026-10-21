'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Stethoscope, Lock, Mail, ArrowRight, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { MINUTOS_INACTIVIDAD, rutaSegura } from '@/lib/auth/session';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = rutaSegura(searchParams.get('redirect'));
  const motivo = searchParams.get('motivo');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login({ email, password });
      // replace: el login no queda en el historial ("Atrás" no vuelve al formulario)
      const esAdmin = data.rol === 'ADMINISTRADOR';
      const destinoValido = redirect && (esAdmin ? redirect.startsWith('/dashboard') : !redirect.startsWith('/dashboard'));
      router.replace(destinoValido ? redirect : esAdmin ? '/dashboard' : '/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciales inválidas o servidor desconectado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
        <p className="mt-1 text-sm text-slate-400">
          Accede a tu cuenta de FisioMarca para gestionar tus reservas
        </p>
      </div>

      {motivo && !error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {motivo === 'inactividad'
              ? `Tu sesión se cerró tras ${MINUTOS_INACTIVIDAD} minutos sin actividad. Vuelve a ingresar.`
              : 'Tu sesión expiró. Vuelve a ingresar para continuar.'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="paciente@ejemplo.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type={verClave ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setVerClave(!verClave)}
              aria-label={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
              aria-pressed={verClave}
              title={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-teal-300"
            >
              {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full shadow-lg shadow-teal-500/20">
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-800/80 text-center text-sm text-slate-400">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/registro" className="text-teal-400 hover:underline font-medium">
          Regístrate aquí
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-slate-400 text-sm">Cargando formulario...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
