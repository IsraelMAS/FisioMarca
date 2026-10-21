// ─── Tipos del Carrito (refleja CarritoDTO de Micro-Carrito) ─────────

export interface Carrito {
  id: number;
  clienteId: number;
  items: CarritoItem[];
  total: number;
  duracionTotalMinutos: number;
}

export interface CarritoItem {
  id: number;
  servicioId: number;
  servicioNombre: string;
  imagenUrl: string | null;
  duracionMinutos: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface AddToCartRequest {
  clienteId: number;
  servicioId: number;
  cantidad: number;
}
