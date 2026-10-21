// ─── Tipos de Reservas ───────────────────────────────────────────────

export type EstadoReserva = 'PENDIENTE_PAGO' | 'PROGRAMADA' | 'EN_ATENCION' | 'ATENDIDA' | 'CANCELADA' | 'EXPIRADA';

export interface Reserva {
  id: number;
  clienteId: number;
  clienteNombre?: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioTotal: number;
  duracionTotalMinutos: number;
  estado: EstadoReserva;
  notas: string | null;
  servicios: ReservaServicio[];
  fechaCreacion?: string;
  fisioterapeutaId?: number | null;
  salaId?: number | null;
  horaLlegada?: string | null;
  ordenCodigo?: string | null;
  metodoPago?: MetodoPago | null;
  pagoReferencia?: string | null;
  fechaPago?: string | null;
  expiraEn?: string | null;
}

export interface ReservaServicio {
  id: number;
  servicioId: number;
  servicioNombre: string;
  precio?: number;
  precioServicio?: number;
  duracionMinutos: number;
}

export interface ReservaCreateRequest {
  clienteId: number;
  fechaHoraInicio: string;
  servicioIds: number[];
  notas?: string;
  fisioterapeutaId?: number;
}

export interface ReprogramarRequest {
  fechaHoraInicio: string;
}

export interface SlotDisponibilidad {
  hora: string;
  disponible: boolean;
  motivo?: string;
}

export interface DisponibilidadResponse {
  duracionTotalMinutos: number;
  horarios: SlotDisponibilidad[];
}

// ─── Dashboard Admin ─────────────────────────────────────────────────
// Refleja DashboardDTO de Micro-Reservas (GET /reservas/dashboard)
export interface ChartPoint {
  label: string;
  value: number;
}

export interface DashboardData {
  totalReservas: number;
  programadas: number;
  atendidas: number;
  canceladas: number;
  tasaCancelacion: number;
  reservasPorDia: ChartPoint[];
  topServicios: ChartPoint[];
  proximas24Horas: Reserva[];
  enAtencion: number;
  citasHoy: number;
  pacientesActivos: number;
}

// ─── Equipo clínico e historial ──────────────────────────────────────
export interface Fisioterapeuta {
  id: number;
  nombre: string;
  especialidad: string | null;
  color: string;
  activo: boolean;
}

export interface Sala {
  id: number;
  nombre: string;
  tipo: string | null;
  activo: boolean;
}

export interface NotaClinica {
  id: number;
  clienteId: number;
  reservaId: number | null;
  fisioterapeutaId: number | null;
  fecha: string;
  motivo: string;
  evolucion: string | null;
  nivelDolor: number | null;
  plan: string | null;
}

// ─── Compra online (checkout + pago simulado) ────────────────────────
export type MetodoPago = 'TARJETA' | 'YAPE' | 'PLIN';
export type EstadoOrden = 'PENDIENTE_PAGO' | 'PAGADA' | 'EXPIRADA' | 'CANCELADA';

export interface CheckoutRequest {
  clienteId: number;
  sesiones: { servicioId: number; fechaHoraInicio: string }[];
  notas?: string;
}

export interface PagoRequest {
  metodo: MetodoPago;
  titular?: string;
  marca?: string;
  ultimos4?: string;
  telefono?: string;
  codigoAprobacion?: string;
}

export interface Orden {
  codigo: string;
  clienteId: number;
  estado: EstadoOrden;
  total: number;
  expiraEn: string | null;
  fechaPago: string | null;
  metodoPago: MetodoPago | null;
  pagoReferencia: string | null;
  reservas: Reserva[];
}
