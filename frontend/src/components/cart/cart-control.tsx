'use client';

import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-context';
import type { CarritoItem, Servicio } from '@/types';

// Selector − n + reutilizable (navbar, tarjetas de servicio, página del carrito)
export function Stepper({
  item,
  size = 'md',
}: {
  item: CarritoItem;
  size?: 'sm' | 'md';
}) {
  const { cambiar, ocupado, restantes } = useCart();
  const cargando = ocupado === item.servicioId;
  const btn = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  return (
    <div className={cn('inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/80', size === 'sm' ? 'p-0.5' : 'p-1')}>
      <button
        type="button"
        onClick={() => cambiar(item, item.cantidad - 1)}
        disabled={cargando}
        aria-label={item.cantidad === 1 ? `Quitar ${item.servicioNombre}` : 'Una sesión menos'}
        className={cn(btn, 'flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40')}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn('min-w-7 text-center font-semibold tabular-nums text-white', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {cargando ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-teal-400" /> : item.cantidad}
      </span>
      <button
        type="button"
        onClick={() => cambiar(item, item.cantidad + 1)}
        disabled={cargando || restantes === 0}
        aria-label="Una sesión más"
        title={restantes === 0 ? 'Llegaste al máximo de sesiones por compra' : undefined}
        className={cn(btn, 'flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-teal-500/15 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent')}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Botón de carrito de una tarjeta de servicio: añade o muestra el selector si ya está
export function CartControl({ servicio }: { servicio: Pick<Servicio, 'id' | 'nombre'> }) {
  const { items, agregar, ocupado } = useCart();
  const item = items.find((i) => i.servicioId === servicio.id);
  if (item) return <Stepper item={item} size="sm" />;

  return (
    <button
      type="button"
      onClick={() => agregar(servicio)}
      disabled={ocupado === servicio.id}
      title="Añadir una sesión al carrito"
      aria-label={`Añadir ${servicio.nombre} al carrito`}
      className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 transition-all hover:border-teal-500 hover:text-white disabled:opacity-50"
    >
      {ocupado === servicio.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
    </button>
  );
}

// "Reservar": asegura el servicio en el carrito y lleva al formulario de horarios y pago
export function ReservarBoton({ servicio, className }: { servicio: Pick<Servicio, 'id' | 'nombre'>; className?: string }) {
  const { cantidadDe, agregar, restantes } = useCart();
  const router = useRouter();

  const reservar = async () => {
    if (cantidadDe(servicio.id) === 0) {
      if (restantes === 0) return router.push('/reservas/nueva');
      const ok = await agregar(servicio);
      if (!ok) return;
    }
    router.push('/reservas/nueva');
  };

  return (
    <Button size="sm" onClick={reservar} className={cn('shadow-md shadow-teal-500/20', className)}>
      Reservar
    </Button>
  );
}
