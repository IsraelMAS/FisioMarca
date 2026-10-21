'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowLeft, ArrowRight, CalendarCheck, Clock, Loader2, ShieldCheck, ShoppingCart, Timer, Trash2 } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MAX_SESIONES, useCart } from '@/components/cart/cart-context';
import { Stepper } from '@/components/cart/cart-control';
import { PasosCompra } from '@/components/cart/pasos-compra';

export default function CarritoPage() {
  const { items, total, sesiones, restantes, listo, quitar, vaciar, ocupado } = useCart();

  if (!listo) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> Cargando tu carrito…
      </div>
    );
  }

  const minutos = items.reduce((a, i) => a + (i.duracionMinutos ?? 45) * i.cantidad, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/servicios" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Seguir viendo tratamientos
      </Link>
      <PasosCompra actual={1} />

      <div className="mt-6 mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tu carrito</h1>
          <p className="mt-1 text-sm text-slate-400">Cada unidad es una sesión. Luego eliges el día y la hora de cada una.</p>
        </div>
        {items.length > 0 && (
          <button onClick={() => vaciar()} disabled={ocupado !== null} className="self-start text-xs text-slate-500 hover:text-rose-300 sm:self-auto">
            Vaciar carrito
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-20 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 ring-1 ring-slate-800">
            <ShoppingCart className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-semibold text-white">Tu carrito está vacío</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">Elige hasta {MAX_SESIONES} sesiones de los tratamientos que necesitas.</p>
          <Link
            href="/servicios"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25"
          >
            Ver tratamientos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="min-w-0 space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    'flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-opacity',
                    ocupado === item.servicioId && 'opacity-60'
                  )}
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800 sm:h-28 sm:w-32">
                    {item.imagenUrl ? (
                      <Image src={item.imagenUrl} alt={item.servicioNombre} fill sizes="128px" className="object-cover" />
                    ) : (
                      <Activity className="m-auto h-full w-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">{item.servicioNombre}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" /> {formatDuration(item.duracionMinutos ?? 45)} por sesión ·{' '}
                          {formatCurrency(Number(item.precioUnitario))} c/u
                        </p>
                      </div>
                      <button
                        onClick={() => quitar(item)}
                        aria-label={`Quitar ${item.servicioNombre}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Stepper item={item} />
                        <span className="text-xs text-slate-500">{item.cantidad === 1 ? '1 sesión' : `${item.cantidad} sesiones`}</span>
                      </div>
                      <span className="text-lg font-bold tabular-nums text-white">{formatCurrency(Number(item.subtotal))}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">Resumen</p>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-300">
                    {sesiones}/{MAX_SESIONES} sesiones
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
                  {Array.from({ length: MAX_SESIONES }).map((_, i) => (
                    <span key={i} className={cn('h-1.5 rounded-full', i < sesiones ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : 'bg-slate-800')} />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {restantes > 0 ? `Puedes añadir ${restantes} más en esta compra.` : 'Llegaste al máximo de sesiones por compra.'}
                </p>
              </div>
              <dl className="space-y-2 px-5 py-4 text-sm">
                <div className="flex justify-between text-slate-400">
                  <dt>Tiempo total en camilla</dt>
                  <dd className="tabular-nums text-slate-200">{formatDuration(minutos)}</dd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <dt>Sesiones</dt>
                  <dd className="tabular-nums text-slate-200">{sesiones}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-800 pt-3">
                  <dt className="text-slate-400">Total</dt>
                  <dd className="text-2xl font-bold tabular-nums text-white">{formatCurrency(total)}</dd>
                </div>
              </dl>
              <div className="space-y-3 border-t border-slate-800 bg-slate-950/40 px-5 py-5">
                <Link
                  href="/reservas/nueva"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-transform hover:scale-[1.01]"
                >
                  <CalendarCheck className="h-4 w-4" /> Elegir horarios y pagar
                </Link>
                <p className="flex items-start gap-2 text-[11px] text-slate-500">
                  <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  Tus horarios se apartan 10 minutos mientras pagas.
                </p>
                <p className="flex items-start gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                  Pago online con tarjeta, Yape o Plin. Sin pagos en recepción.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
