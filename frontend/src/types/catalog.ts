// ─── Tipos del Catálogo ──────────────────────────────────────────────

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string | null;
  activo: boolean;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  imagenUrl: string | null;
  activo: boolean;
  categoriaId: number;
  categoriaNombre?: string;
}

export interface ServicioCreateRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  imagenUrl: string | null;
  activo: boolean;
  categoriaId: number;
}

export interface CategoriaCreateRequest {
  nombre: string;
  descripcion: string;
  imagenUrl: string | null;
  activo: boolean;
}

export interface ServicioFilter {
  q?: string;
  maxPrecio?: number;
  categoriaId?: number;
}
