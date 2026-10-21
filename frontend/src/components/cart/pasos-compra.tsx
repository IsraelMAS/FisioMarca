import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PASOS = ['Carrito', 'Horarios', 'Pago', 'Confirmación'];

// Indicador de progreso de la compra (1 Carrito → 4 Confirmación)
export function PasosCompra({ actual }: { actual: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:gap-3" aria-label="Progreso de la compra">
      {PASOS.map((p, i) => {
        const n = i + 1;
        const hecho = n < actual;
        const activo = n === actual;
        return (
          <li key={p} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-colors',
                hecho && 'border-teal-500 bg-teal-500 text-slate-950',
                activo && 'border-teal-400 bg-teal-500/15 text-teal-300 ring-4 ring-teal-500/10',
                !hecho && !activo && 'border-slate-700 text-slate-500'
              )}
              aria-current={activo ? 'step' : undefined}
            >
              {hecho ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={cn('font-medium', activo ? 'text-white' : hecho ? 'text-slate-300' : 'text-slate-500')}>{p}</span>
            {n < PASOS.length && <span className={cn('h-px w-6 sm:w-10', hecho ? 'bg-teal-500/60' : 'bg-slate-800')} />}
          </li>
        );
      })}
    </ol>
  );
}
