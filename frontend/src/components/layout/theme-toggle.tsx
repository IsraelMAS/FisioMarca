'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cambiarTema, leerTema, suscribirTema } from '@/lib/tema';

// ─── Botón de tema (sitio, paciente y panel admin) ───────────────────
// En el prerender se asume oscuro; al hidratar toma el tema real.
export function ThemeToggle({ className }: { className?: string }) {
  const claro = useSyncExternalStore(suscribirTema, leerTema, () => 'dark') === 'light';

  return (
    <button
      type="button"
      onClick={() => cambiarTema(claro ? 'dark' : 'light')}
      aria-label={claro ? 'Activar modo oscuro' : 'Activar modo claro'}
      title={claro ? 'Modo oscuro' : 'Modo claro'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white',
        className
      )}
    >
      {claro ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  );
}
