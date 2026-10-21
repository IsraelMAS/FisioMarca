'use client';

import * as React from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { AlertTriangle, Inbox, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { estadoMeta } from '@/lib/admin';
import type { EstadoReserva } from '@/types';

// ─── Bloques reutilizables del panel de administración ──────────────

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-slate-800/80 bg-slate-900/50', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const tones = {
  teal: 'bg-teal-500/10 text-teal-400 ring-teal-500/20',
  sky: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
} as const;

// Número que sube desde el valor anterior hasta el nuevo
export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const [actual, setActual] = React.useState(0);
  const previo = React.useRef(0);

  React.useEffect(() => {
    const controles = animate(previo.current, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setActual(v),
    });
    previo.current = value;
    return () => controles.stop();
  }, [value]);

  return <>{format ? format(actual) : Math.round(actual).toLocaleString('es-PE')}</>;
}

export function StatCard({
  label,
  value,
  format,
  hint,
  icon: Icon,
  tone = 'teal',
  loading,
}: {
  label: string;
  value: React.ReactNode;
  format?: (n: number) => string;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof tones;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl ring-1', tones[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
      ) : (
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white">
          {typeof value === 'number' ? <CountUp value={value} format={format} /> : value}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Aviso cuando un microservicio no responde (en lugar de mostrar datos inventados)
export function ErrorBanner({
  service,
  message,
  onRetry,
}: {
  service: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-amber-200">No se pudo conectar con {service}</p>
        <p className="mt-0.5 text-xs text-amber-200/60">
          {/* "Failed to fetch" = el Gateway no respondió; mejor una pista útil */}
          {message && !/failed to fetch/i.test(message)
            ? message
            : 'Verifica que el microservicio y el Gateway (8080) estén levantados.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            value === o.value ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                'rounded-md px-1.5 text-[10px] tabular-nums',
                value === o.value ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-500'
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Tabla ───────────────────────────────────────────────────────────

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50">
      {/* relative: los hijos absolutos (p. ej. sr-only) no deben escapar del scroll y ensanchar la página en móvil */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-slate-800/80 bg-slate-950/40 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-500',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-5 py-3.5 align-middle', className)}>{children}</td>;
}

export function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-800/50 last:border-0">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 animate-pulse rounded bg-slate-800/80" style={{ width: `${50 + ((i + j) % 4) * 12}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Paginación ──────────────────────────────────────────────────────

// Números visibles: 1 … 4 5 6 … 20
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total));
  const orden = [...set].sort((a, b) => a - b);
  const salida: (number | '…')[] = [];
  orden.forEach((n, i) => {
    if (i > 0 && n - orden[i - 1] > 1) salida.push('…');
    salida.push(n);
  });
  return salida;
}

export function Paginacion({
  pagina,
  total,
  porPagina,
  onPagina,
  onPorPagina,
  opciones = [10, 20, 50],
}: {
  pagina: number;
  total: number;
  porPagina: number;
  onPagina: (p: number) => void;
  onPorPagina: (n: number) => void;
  opciones?: number[];
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  const btn =
    'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-30';

  return (
    <nav className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Paginación">
      <p className="text-xs text-slate-500">
        Mostrando <span className="font-semibold text-slate-300">{desde}–{hasta}</span> de{' '}
        <span className="font-semibold text-slate-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button className={cn(btn, 'text-slate-400 hover:bg-slate-800 hover:text-white')} onClick={() => onPagina(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">
          ‹
        </button>
        {paginasVisibles(pagina, paginas).map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="px-1 text-xs text-slate-600">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPagina(n)}
              aria-current={n === pagina ? 'page' : undefined}
              className={cn(btn, n === pagina ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}
            >
              {n}
            </button>
          )
        )}
        <button className={cn(btn, 'text-slate-400 hover:bg-slate-800 hover:text-white')} onClick={() => onPagina(pagina + 1)} disabled={pagina >= paginas} aria-label="Página siguiente">
          ›
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-500">
        Por página
        <select
          value={porPagina}
          onChange={(e) => onPorPagina(Number(e.target.value))}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-teal-500/60 focus:outline-none"
        >
          {opciones.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    </nav>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 shadow-2xl sm:max-w-lg sm:rounded-2xl"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
              <div className="flex items-start gap-3">
                {Icon && (
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                )}
                <div>
                  <h3 className="text-base font-semibold text-white">{title}</h3>
                  {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Estado y profesional de una cita ───────────────────────────────

export function EstadoBadge({ estado }: { estado: EstadoReserva }) {
  const m = estadoMeta[estado];
  return <Badge variant={m?.variant}>{m?.label ?? estado}</Badge>;
}

export function FisioTag({
  fisio,
  sala,
}: {
  fisio?: { nombre: string; color: string } | null;
  sala?: { nombre: string } | null;
}) {
  if (!fisio) return <span className="text-xs text-slate-600">Sin asignar</span>;
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 truncate text-sm text-slate-200">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fisio.color }} />
        {fisio.nombre}
      </p>
      {sala && <p className="mt-0.5 truncate pl-4 text-xs text-slate-500">{sala.nombre}</p>}
    </div>
  );
}

// ─── Formularios ─────────────────────────────────────────────────────

export const fieldClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}
