'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, Clock, ShieldCheck, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MAX_SESIONES, useCart } from '@/components/cart/cart-context';
import { Stepper } from '@/components/cart/cart-control';

// Carrito desplegable del navbar
export function CartDropdown() {
  const { items, total, sesiones, restantes, abierto, setAbierto, pulso, quitar, ocupado } = useCart();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto, setAbierto]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        aria-label={`Carrito, ${sesiones} sesiones`}
        aria-expanded={abierto}
        className={cn(
          'relative rounded-xl p-2 transition-colors',
          abierto ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-teal-400'
        )}
      >
        <ShoppingCart className="h-5 w-5" />
        <AnimatePresence>
          {sesiones > 0 && (
            <motion.span
              key={pulso}
              initial={{ scale: 0.4 }}
              animate={{ scale: [1.35, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 px-1 text-[10px] font-bold text-slate-950 ring-2 ring-slate-950"
            >
              {sesiones}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[400px]"
            role="dialog"
            aria-label="Carrito de compras"
          >
            {/* Encabezado + progreso de sesiones */}
            <div className="border-b border-slate-800 px-5 pb-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">Tu carrito</p>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-300">
                  {sesiones}/{MAX_SESIONES} sesiones
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
                {Array.from({ length: MAX_SESIONES }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-colors duration-300',
                      i < sesiones ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : 'bg-slate-800'
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {restantes > 0
                  ? `Puedes añadir ${restantes} ${restantes === 1 ? 'sesión más' : 'sesiones más'} en esta compra.`
                  : 'Llegaste al máximo por compra. Agenda estas sesiones para seguir.'}
              </p>
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                  <ShoppingCart className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-slate-200">Tu carrito está vacío</p>
                <p className="mt-1 text-xs text-slate-500">Añade sesiones desde el catálogo de tratamientos.</p>
                <Link
                  href="/servicios"
                  onClick={() => setAbierto(false)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300"
                >
                  Explorar servicios <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <ul className="max-h-[46vh] divide-y divide-slate-800/70 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.id} className={cn('flex gap-3 px-5 py-3.5 transition-opacity', ocupado === item.servicioId && 'opacity-60')}>
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                        {item.imagenUrl ? (
                          <Image src={item.imagenUrl} alt="" fill sizes="56px" className="object-cover" />
                        ) : (
                          <Activity className="m-auto h-full w-6 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-white">{item.servicioNombre}</p>
                          <button
                            onClick={() => quitar(item)}
                            aria-label={`Quitar ${item.servicioNombre}`}
                            className="shrink-0 rounded-md p-1 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          {formatDuration(item.duracionMinutos ?? 45)} · {formatCurrency(Number(item.precioUnitario))} c/u
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <Stepper item={item} size="sm" />
                          <span className="text-sm font-semibold tabular-nums text-white">{formatCurrency(Number(item.subtotal))}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-slate-800 bg-slate-950/40 px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400">Total</span>
                    <span className="text-xl font-bold tabular-nums text-white">{formatCurrency(total)}</span>
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
                    Pagas online y tus horarios quedan asegurados al instante.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/carrito"
                      onClick={() => setAbierto(false)}
                      className="flex h-10 items-center justify-center rounded-xl border border-slate-700 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
                    >
                      Ver carrito
                    </Link>
                    <Link
                      href="/reservas/nueva"
                      onClick={() => setAbierto(false)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-transform hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Agendar y pagar
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
