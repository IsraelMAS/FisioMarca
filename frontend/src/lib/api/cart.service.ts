// ─── MICRO-CARRITO Adapter ────────────────────────────────────────────
// Todas las rutas requieren JWT. El pago y la reserva se hacen en Micro-Reservas (/checkout).

import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Carrito, AddToCartRequest } from '@/types';

export const cartService = {
  get: (clienteId: number) =>
    apiGet<Carrito>(`/carrito/${clienteId}`),

  addItem: (body: AddToCartRequest) =>
    apiPost<Carrito>('/carrito/items', body),

  updateQuantity: (clienteId: number, itemId: number, cantidad: number) =>
    apiPut<Carrito>(`/carrito/${clienteId}/items/${itemId}?cantidad=${cantidad}`),

  removeItem: (clienteId: number, itemId: number) =>
    apiDelete<Carrito>(`/carrito/${clienteId}/items/${itemId}`),

  clear: (clienteId: number) =>
    apiDelete<Carrito>(`/carrito/${clienteId}/vaciar`),
};
