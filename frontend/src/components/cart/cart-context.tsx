'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { cartService } from '@/lib/api/cart.service';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/components/admin/toast';
import type { Carrito, CarritoItem, Servicio } from '@/types';

// Regla de negocio (igual que Micro-Carrito): máximo de sesiones por compra
export const MAX_SESIONES = 4;

interface CartContextType {
  items: CarritoItem[];
  total: number;
  sesiones: number;
  restantes: number;
  cargando: boolean;
  listo: boolean;
  ocupado: number | null;
  abierto: boolean;
  setAbierto: (v: boolean) => void;
  pulso: number;
  cantidadDe: (servicioId: number) => number;
  agregar: (servicio: Pick<Servicio, 'id' | 'nombre'>) => Promise<boolean>;
  cambiar: (item: CarritoItem, cantidad: number) => Promise<void>;
  quitar: (item: CarritoItem) => Promise<void>;
  vaciar: (silencioso?: boolean) => Promise<void>;
  recargar: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const clienteId = !isAdmin ? user?.clienteId ?? null : null;
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [pulso, setPulso] = useState(0);
  const [listo, setListo] = useState(false);

  const recargar = useCallback(async () => {
    if (!clienteId) return;
    try {
      const res = await cartService.get(clienteId);
      setCarrito(res.data);
    } catch {
      /* el carrito se reintenta en la próxima acción */
    } finally {
      setCargando(false);
    }
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) return;
    let cancel = false;
    cartService
      .get(clienteId)
      .then((res) => !cancel && setCarrito(res.data))
      .catch(() => {})
      .finally(() => !cancel && setListo(true));
    return () => {
      cancel = true;
    };
  }, [clienteId]);

  const items = useMemo(() => (clienteId ? carrito?.items ?? [] : []), [carrito, clienteId]);
  const sesiones = items.reduce((a, i) => a + i.cantidad, 0);

  const ejecutar = useCallback(
    async (id: number, accion: () => Promise<{ data: Carrito }>) => {
      setOcupado(id);
      try {
        const res = await accion();
        setCarrito(res.data);
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el carrito');
        return false;
      } finally {
        setOcupado(null);
      }
    },
    [toast]
  );

  const agregar = useCallback(
    async (servicio: Pick<Servicio, 'id' | 'nombre'>) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(location.pathname)}`);
        return false;
      }
      if (!clienteId) return false;
      if (sesiones >= MAX_SESIONES) {
        toast.error(`Máximo ${MAX_SESIONES} sesiones por compra. Agenda estas primero.`);
        setAbierto(true);
        return false;
      }
      const ok = await ejecutar(servicio.id, () => cartService.addItem({ clienteId, servicioId: servicio.id, cantidad: 1 }));
      if (ok) {
        setPulso((p) => p + 1);
        toast.success(`${servicio.nombre} añadido al carrito`);
      }
      return ok;
    },
    [isAuthenticated, clienteId, sesiones, ejecutar, router, toast]
  );

  const cambiar = useCallback(
    async (item: CarritoItem, cantidad: number) => {
      if (!clienteId) return;
      if (cantidad < 1) {
        await ejecutar(item.servicioId, () => cartService.removeItem(clienteId, item.id));
        return;
      }
      if (cantidad > item.cantidad && sesiones >= MAX_SESIONES) {
        toast.error(`Llegaste al máximo de ${MAX_SESIONES} sesiones por compra`);
        return;
      }
      const ok = await ejecutar(item.servicioId, () => cartService.updateQuantity(clienteId, item.id, cantidad));
      if (ok && cantidad > item.cantidad) setPulso((p) => p + 1);
    },
    [clienteId, sesiones, ejecutar, toast]
  );

  const quitar = useCallback(
    async (item: CarritoItem) => {
      if (!clienteId) return;
      await ejecutar(item.servicioId, () => cartService.removeItem(clienteId, item.id));
    },
    [clienteId, ejecutar]
  );

  const vaciar = useCallback(
    async (silencioso = false) => {
      if (!clienteId) return;
      const ok = await ejecutar(-1, () => cartService.clear(clienteId));
      if (ok && !silencioso) toast.success('Carrito vacío');
    },
    [clienteId, ejecutar, toast]
  );

  const cantidadDe = useCallback((servicioId: number) => items.find((i) => i.servicioId === servicioId)?.cantidad ?? 0, [items]);

  const value: CartContextType = {
    items,
    total: items.reduce((a, i) => a + Number(i.subtotal), 0),
    sesiones,
    restantes: Math.max(0, MAX_SESIONES - sesiones),
    cargando,
    listo: listo || !clienteId,
    ocupado,
    abierto,
    setAbierto,
    pulso,
    cantidadDe,
    agregar,
    cambiar,
    quitar,
    vaciar,
    recargar: async () => {
      setCargando(true);
      await recargar();
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
