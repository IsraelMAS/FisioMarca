// ─── Helpers del panel admin ─────────────────────────────────────────

import type { EstadoReserva, Reserva, ReservaServicio } from '@/types';

export const estadoMeta: Record<
  EstadoReserva,
  { label: string; variant: 'info' | 'success' | 'danger' | 'warning'; color: string }
> = {
  PENDIENTE_PAGO: { label: 'Pago pendiente', variant: 'warning', color: '#f59e0b' },
  EXPIRADA: { label: 'Expirada', variant: 'danger', color: '#64748b' },
  PROGRAMADA: { label: 'Pendiente', variant: 'info', color: '#38bdf8' },
  EN_ATENCION: { label: 'En atención', variant: 'warning', color: '#fbbf24' },
  ATENDIDA: { label: 'Completado', variant: 'success', color: '#34d399' },
  CANCELADA: { label: 'Cancelado', variant: 'danger', color: '#fb7185' },
};

// fechaHoraInicio llega como hora local sin zona ("2026-10-20T16:00:00")
export const diaDe = (r: Reserva) => r.fechaHoraInicio.slice(0, 10);

export function horaDe(iso: string): string {
  return iso.slice(11, 16);
}

export function nombresServicios(r: Reserva): string {
  return r.servicios?.map((s) => s.servicioNombre).filter(Boolean).join(', ') || 'Sin servicios';
}

export const METODO_LABEL: Record<string, string> = { TARJETA: 'Tarjeta', YAPE: 'Yape', PLIN: 'Plin' };

// Texto corto del estado de pago de una cita
export function estadoPago(r: Reserva): string {
  if (r.fechaPago) return `Pagado · ${METODO_LABEL[r.metodoPago ?? ''] ?? 'Online'}`;
  if (r.estado === 'PENDIENTE_PAGO') return 'Esperando pago';
  if (r.estado === 'EXPIRADA') return 'No pagado';
  return 'Pago en sede';
}

export function seCruzan(a: Reserva, b: Reserva): boolean {
  return a.fechaHoraInicio < b.fechaHoraFin && a.fechaHoraFin > b.fechaHoraInicio;
}

// Fecha local YYYY-MM-DD (toISOString usa UTC y en Perú cambia de día a las 19:00)
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type Rango = 'hoy' | 'ayer' | 'manana' | 'semana' | 'mes' | 'anio';

export const rangos: { value: Rango; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'manana', label: 'Mañana' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'anio', label: 'Este año' },
];

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Lunes de la semana de la fecha dada
export function inicioSemana(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7;
  return addDays(r, -dow);
}

export function rangoFechas(rango: Rango): { desde: Date; hasta: Date } {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  switch (rango) {
    case 'hoy':
      return { desde: hoy, hasta: hoy };
    case 'ayer':
      return { desde: addDays(hoy, -1), hasta: addDays(hoy, -1) };
    case 'manana':
      return { desde: addDays(hoy, 1), hasta: addDays(hoy, 1) };
    case 'semana': {
      const lunes = inicioSemana(hoy);
      return { desde: lunes, hasta: addDays(lunes, 6) };
    }
    case 'anio':
      return { desde: new Date(hoy.getFullYear(), 0, 1), hasta: new Date(hoy.getFullYear(), 11, 31) };
    case 'mes':
    default:
      return {
        desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        hasta: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0),
      };
  }
}

// Micro-Reservas no envía duracionTotalMinutos: se calcula con inicio/fin
export function duracionReserva(r: Reserva): number {
  if (r.duracionTotalMinutos) return r.duracionTotalMinutos;
  if (r.fechaHoraInicio && r.fechaHoraFin) {
    const diff = (new Date(r.fechaHoraFin).getTime() - new Date(r.fechaHoraInicio).getTime()) / 60000;
    if (diff > 0) return Math.round(diff);
  }
  return r.servicios?.reduce((acc, s) => acc + (s.duracionMinutos || 0), 0) ?? 0;
}

export function precioServicio(s: ReservaServicio): number {
  return Number(s.precioServicio ?? s.precio ?? 0);
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
