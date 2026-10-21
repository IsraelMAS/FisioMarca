'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Home, LayoutDashboard, LogIn, RotateCcw, Sparkles, Stethoscope } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

// ─── Pantalla de estado (404 / error) con estética premium ────────────
// Línea de electrocardiograma animada: plana (404) o irregular (error).

type Variante = '404' | 'error';

export function PaginaEstado({ variante, onReintentar }: { variante: Variante; onReintentar?: () => void }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const es404 = variante === '404';

  const principal = !isAuthenticated
    ? { href: '/login', label: 'Iniciar sesión', icon: LogIn }
    : isAdmin
      ? { href: '/dashboard', label: 'Ir a mi panel', icon: LayoutDashboard }
      : { href: '/reservas', label: 'Ver mis citas', icon: CalendarDays };
  const Principal = principal.icon;

  return (
    <div className="relative isolate flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* Fondo: halo, retícula fina y grano */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/5 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="w-full max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/80"
        >
          <Sparkles className="h-3 w-3" />
          {es404 ? 'Error 404 · Página no encontrada' : 'Error inesperado'}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="estado-numero mt-6 select-none text-[clamp(6rem,22vw,11rem)] font-black leading-none tracking-[-0.06em]"
          aria-label={es404 ? '404' : 'Error'}
        >
          {es404 ? '404' : '500'}
        </motion.h1>

        {/* Monitor cardíaco */}
        <div className="relative mx-auto -mt-4 h-20 w-full max-w-lg" aria-hidden="true">
          <svg viewBox="0 0 520 80" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ecg" x1="0" x2="1">
                <stop offset="0" stopColor="#2dd4bf" stopOpacity="0" />
                <stop offset="0.2" stopColor="#2dd4bf" />
                <stop offset="0.8" stopColor="#fcd34d" />
                <stop offset="1" stopColor="#fcd34d" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="estado-ecg"
              d={
                es404
                  ? 'M0 40 H150 L165 40 L175 12 L188 68 L198 40 H330 L340 40 L348 30 L356 50 L364 40 H520'
                  : 'M0 40 H120 L132 10 L142 70 L152 22 L162 58 L172 40 H250 L262 6 L274 74 L286 40 H360 L370 28 L380 52 L390 40 H520'
              }
              fill="none"
              stroke="url(#ecg)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {es404 ? 'Esta página está en rehabilitación' : 'Algo no salió como esperábamos'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
            {es404
              ? 'La dirección que buscas no existe o fue movida. Te ayudamos a retomar el camino hacia tu recuperación.'
              : 'Ocurrió un error al mostrar esta sección. Puedes intentarlo de nuevo; si persiste, vuelve al inicio.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          {onReintentar ? (
            <button
              onClick={onReintentar}
              className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 px-7 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_-10px_rgba(45,212,191,0.6)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-45" />
              Intentar de nuevo
            </button>
          ) : (
            <Link
              href={principal.href}
              className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 px-7 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_-10px_rgba(45,212,191,0.6)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <Principal className="h-4 w-4" />
              {principal.label}
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-amber-200/20 bg-white/[0.02] px-7 text-sm font-semibold text-amber-100/90 backdrop-blur transition-colors hover:border-amber-200/40 hover:bg-amber-200/5"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        </motion.div>

        {es404 && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/5 pt-6 text-sm text-slate-500"
            aria-label="Enlaces sugeridos"
          >
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-600">
              <Stethoscope className="h-3.5 w-3.5" /> Quizás buscabas
            </span>
            <Link href="/servicios" className="transition-colors hover:text-teal-300">Servicios</Link>
            <Link href="/categorias" className="transition-colors hover:text-teal-300">Categorías</Link>
            {!isAdmin && <Link href="/reservas/nueva" className="transition-colors hover:text-teal-300">Agendar cita</Link>}
          </motion.nav>
        )}

        <button
          onClick={() => history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-600 transition-colors hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Regresar a la página anterior
        </button>
      </div>
    </div>
  );
}
