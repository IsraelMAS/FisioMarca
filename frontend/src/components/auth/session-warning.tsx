'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MINUTOS_INACTIVIDAD, SEGUNDOS_AVISO } from '@/lib/auth/session';

// Aviso previo al cierre de sesión por inactividad
export function SessionWarning({
  segundos,
  onContinuar,
  onSalir,
}: {
  segundos: number;
  onContinuar: () => void;
  onSalir: () => void;
}) {
  const mm = Math.floor(segundos / 60);
  const ss = String(segundos % 60).padStart(2, '0');
  const pct = (segundos / SEGUNDOS_AVISO) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl"
      >
        <div className="relative mx-auto mb-4 h-20 w-20">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-slate-800)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${pct} 100`}
              pathLength={100}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-white">
            {mm}:{ss}
          </span>
        </div>
        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold text-white">
          <Clock className="h-5 w-5 text-amber-400" />
          ¿Sigues ahí?
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Por tu seguridad, la sesión se cerrará tras {MINUTOS_INACTIVIDAD} minutos sin actividad.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onContinuar}>Seguir conectado</Button>
          <Button variant="ghost" onClick={onSalir}>
            Cerrar sesión ahora
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
