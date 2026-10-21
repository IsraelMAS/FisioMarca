'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dos botones-ícono compactos: descargar PDF y Excel
export function ExportButtons({
  onPDF,
  onExcel,
  disabled,
  className,
}: {
  onPDF: () => Promise<void>;
  onExcel: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}) {
  const [cargando, setCargando] = useState<'pdf' | 'xlsx' | null>(null);

  const ejecutar = async (tipo: 'pdf' | 'xlsx', fn: () => Promise<void>) => {
    setCargando(tipo);
    try {
      await fn();
    } finally {
      setCargando(null);
    }
  };

  const base =
    'group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)} role="group" aria-label="Exportar">
      <button
        type="button"
        onClick={() => ejecutar('pdf', onPDF)}
        disabled={disabled || cargando !== null}
        title="Descargar PDF"
        aria-label="Descargar PDF"
        className={cn(base, 'border-rose-500/25 bg-rose-500/[0.07] text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/15')}
      >
        {cargando === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        <Etiqueta texto="PDF" />
      </button>
      <button
        type="button"
        onClick={() => ejecutar('xlsx', onExcel)}
        disabled={disabled || cargando !== null}
        title="Descargar Excel"
        aria-label="Descargar Excel"
        className={cn(base, 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/15')}
      >
        {cargando === 'xlsx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        <Etiqueta texto="Excel" />
      </button>
    </div>
  );
}

function Etiqueta({ texto }: { texto: string }) {
  return (
    <span className="pointer-events-none absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-200 opacity-0 shadow transition-opacity group-hover:opacity-100">
      {texto}
    </span>
  );
}
