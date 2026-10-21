// ─── MICRO-CATALOGO Adapter ──────────────────────────────────────────
// Rutas públicas: GET /catalogo/*
// Rutas admin:    POST/PUT /catalogo/*

import { apiGet, apiPost, apiPut } from './client';
import type {
  Categoria,
  CategoriaCreateRequest,
  Servicio,
  ServicioCreateRequest,
  ServicioFilter,
} from '@/types';

export const catalogService = {
  // ─── Públicas ────────────────────────────────────────────────────
  getCategories: () =>
    apiGet<Categoria[]>('/catalogo/categorias/lista'),

  getCategoryById: (id: number) =>
    apiGet<Categoria>(`/catalogo/categorias/buscar/${id}`),

  getActiveServices: () =>
    apiGet<Servicio[]>('/catalogo/servicios/activos'),

  getServiceById: (id: number) =>
    apiGet<Servicio>(`/catalogo/servicios/buscar/${id}`),

  filterServices: (filters: ServicioFilter) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.maxPrecio) params.set('maxPrecio', String(filters.maxPrecio));
    if (filters.categoriaId) params.set('categoriaId', String(filters.categoriaId));
    return apiGet<Servicio[]>(`/catalogo/servicios/filtro?${params.toString()}`);
  },

  // ─── Admin ───────────────────────────────────────────────────────
  // Incluye servicios inactivos (para el panel de administración)
  getAllServices: () =>
    apiGet<Servicio[]>('/catalogo/servicios/lista'),

  createCategory: (body: CategoriaCreateRequest) =>
    apiPost<Categoria>('/catalogo/categorias/registrar', body),

  updateCategory: (body: Categoria) =>
    apiPut<Categoria>('/catalogo/categorias/actualizar', body),

  createService: (body: ServicioCreateRequest) =>
    apiPost<Servicio>('/catalogo/servicios/registrar', body),

  updateService: (body: Servicio) =>
    apiPut<Servicio>('/catalogo/servicios/actualizar', body),

  toggleServiceStatus: (id: number, activo: boolean) =>
    apiPut<Servicio>(`/catalogo/servicios/estado/${id}?activo=${activo}`),
};
