// ─── MICRO-RESERVAS Adapter ──────────────────────────────────────────
// Todas las rutas requieren JWT

import { apiGet, apiPost, apiPut } from './client';
import type {
  Reserva,
  ReservaCreateRequest,
  ReprogramarRequest,
  DisponibilidadResponse,
  DashboardData,
  Fisioterapeuta,
  Sala,
  NotaClinica,
  CheckoutRequest,
  PagoRequest,
  Orden,
} from '@/types';

export const bookingService = {
  // ─── Cliente ─────────────────────────────────────────────────────
  checkAvailability: (fecha: string, servicioIds: number[]) => {
    const params = new URLSearchParams();
    params.set('fecha', fecha);
    servicioIds.forEach(id => params.append('servicioIds', String(id)));
    return apiGet<DisponibilidadResponse>(
      `/reservas/disponibilidad?${params.toString()}`
    );
  },

  create: (body: ReservaCreateRequest) =>
    apiPost<Reserva>('/reservas/registrar', body),

  getById: (id: number) =>
    apiGet<Reserva>(`/reservas/buscar/${id}`),

  getByClient: (clienteId: number) =>
    apiGet<Reserva[]>(`/reservas/cliente/${clienteId}`),

  cancel: (id: number, motivo?: string) =>
    apiPut<Reserva>(`/reservas/cancelar/${id}${motivo ? `?motivo=${encodeURIComponent(motivo)}` : ''}`),

  reschedule: (id: number, body: ReprogramarRequest) =>
    apiPut<Reserva>(`/reservas/reprogramar/${id}`, body),

  // ─── Compra online: reserva temporal (10 min) → pago ─────────────
  checkout: (body: CheckoutRequest) =>
    apiPost<Orden>('/reservas/checkout', body),

  getOrder: (codigo: string) =>
    apiGet<Orden>(`/reservas/orden/${encodeURIComponent(codigo)}`),

  payOrder: (codigo: string, body: PagoRequest) =>
    apiPost<Orden>(`/reservas/orden/${encodeURIComponent(codigo)}/pagar`, body),

  cancelOrder: (codigo: string) =>
    apiPut<Orden>(`/reservas/orden/${encodeURIComponent(codigo)}/cancelar`),

  // ─── Admin ───────────────────────────────────────────────────────
  listAll: () =>
    apiGet<Reserva[]>('/reservas/lista'),

  getDashboard: (desde: string, hasta: string) =>
    apiGet<DashboardData>(
      `/reservas/dashboard?desde=${desde}&hasta=${hasta}`
    ),

  markAttended: (id: number) =>
    apiPut<Reserva>(`/reservas/atender/${id}`),

  checkIn: (id: number) =>
    apiPut<Reserva>(`/reservas/checkin/${id}`),

  reassign: (id: number, body: { fisioterapeutaId?: number; salaId?: number }) =>
    apiPut<Reserva>(`/reservas/reasignar/${id}`, body),

  // ─── Equipo clínico ──────────────────────────────────────────────
  listTherapists: () =>
    apiGet<Fisioterapeuta[]>('/reservas/fisioterapeutas'),

  saveTherapist: (body: Partial<Fisioterapeuta>, id?: number) =>
    id
      ? apiPut<Fisioterapeuta>(`/reservas/fisioterapeutas/${id}`, body)
      : apiPost<Fisioterapeuta>('/reservas/fisioterapeutas', body),

  listRooms: () =>
    apiGet<Sala[]>('/reservas/salas'),

  saveRoom: (body: Partial<Sala>, id?: number) =>
    id ? apiPut<Sala>(`/reservas/salas/${id}`, body) : apiPost<Sala>('/reservas/salas', body),

  // ─── Historial clínico ───────────────────────────────────────────
  getHistory: (clienteId: number) =>
    apiGet<NotaClinica[]>(`/reservas/historial/${clienteId}`),

  addNote: (body: Omit<NotaClinica, 'id' | 'fecha'> & { fecha?: string }) =>
    apiPost<NotaClinica>('/reservas/historial', body),
};
