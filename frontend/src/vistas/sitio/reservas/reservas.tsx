'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookingService } from '@/lib/api/booking.service';
import { useAuth } from '@/lib/auth/context';
import { formatDateTime, formatCurrency, formatDuration } from '@/lib/format';
import { duracionReserva, estadoMeta, estadoPago, horaDe, nombresServicios } from '@/lib/admin';
import { exportarExcel, exportarPDF, nombreArchivo, type Reporte } from '@/lib/export';
import { ExportButtons } from '@/components/ui/export-buttons';
import type { Fisioterapeuta, Reserva, Sala } from '@/types';

export default function MisReservasPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [fisios, setFisios] = useState<Record<number, Fisioterapeuta>>({});
  const [salas, setSalas] = useState<Record<number, Sala>>({});

  const fetchReservas = async () => {
    if (!user?.clienteId) return;
    setLoading(true);
    setError(null);
    try {
      const [res, f, s] = await Promise.all([
        bookingService.getByClient(user.clienteId),
        bookingService.listTherapists().catch(() => null),
        bookingService.listRooms().catch(() => null),
      ]);
      // Las compras que no se pagaron a tiempo (EXPIRADA) nunca fueron citas: no se muestran
      setReservas((res.data || []).filter((r) => r.estado !== 'EXPIRADA'));
      setFisios(Object.fromEntries((f?.data ?? []).map((x) => [x.id, x])));
      setSalas(Object.fromEntries((s?.data ?? []).map((x) => [x.id, x])));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor de reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.clienteId) {
      fetchReservas();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, user, isLoading]);

  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    setCancellingId(id);
    try {
      await bookingService.cancel(id);
      await fetchReservas();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'No se pudo cancelar la reserva.');
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="py-24 text-center max-w-2xl mx-auto px-4">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-400 mx-auto mb-3" />
        <p className="text-slate-400">Consultando tus citas con el servidor de reservas...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center space-y-4">
        <CalendarDays className="h-16 w-16 text-slate-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Inicia sesión para ver tus citas</h2>
        <p className="text-slate-400 text-sm">
          Debes acceder con tu cuenta de paciente para revisar tu historial y próximas sesiones de fisioterapia.
        </p>
        <Link href="/login?redirect=/reservas">
          <Button className="mt-4">Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  const reporte = (): Reporte => {
    const pagadas = reservas.filter((r) => r.fechaPago);
    return {
      titulo: 'Mis citas y pagos',
      subtitulo: `${user?.nombre ?? 'Paciente'} · ${reservas.length} citas`,
      columnas: ['Orden', 'Fecha', 'Hora', 'Tratamiento', 'Fisioterapeuta', 'Sala', 'Estado', 'Pago', 'Precio'],
      filas: [...reservas]
        .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
        .map((r) => [
          r.ordenCodigo ?? '—',
          r.fechaHoraInicio.slice(0, 10),
          `${horaDe(r.fechaHoraInicio)}–${horaDe(r.fechaHoraFin)}`,
          nombresServicios(r),
          r.fisioterapeutaId ? fisios[r.fisioterapeutaId]?.nombre ?? '—' : '—',
          r.salaId ? salas[r.salaId]?.nombre ?? '—' : '—',
          estadoMeta[r.estado]?.label ?? r.estado,
          r.pagoReferencia ?? estadoPago(r),
          formatCurrency(Number(r.precioTotal)),
        ]),
      resumen: [
        ['Citas', String(reservas.length)],
        ['Pagadas online', String(pagadas.length)],
        ['Total pagado', formatCurrency(pagadas.reduce((a, r) => a + Number(r.precioTotal), 0))],
      ],
      archivo: nombreArchivo('mis-citas-fisiomarca'),
    };
  };

  const renderBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return <Badge variant="warning">Esperando pago</Badge>;
      case 'PROGRAMADA':
        return <Badge variant="info">Programada</Badge>;
      case 'EN_ATENCION':
        return <Badge variant="warning">En atención</Badge>;
      case 'ATENDIDA':
        return <Badge variant="success">Atendida</Badge>;
      case 'CANCELADA':
        return <Badge variant="danger">Cancelada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-teal-400" />
            Mis Citas y Tratamientos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Historial y citas activas en FisioMarca para {user?.nombre}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButtons disabled={reservas.length === 0} onPDF={() => exportarPDF(reporte())} onExcel={() => exportarExcel(reporte(), 'Mis citas')} />
          <Link href="/servicios">
            <Button className="shadow-lg shadow-teal-500/25">
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva Cita
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Reservas */}
      {reservas.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-slate-800 mt-8">
          <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-600">
            <CalendarDays className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No tienes citas programadas actualmente</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Agenda tu primera sesión de evaluación o tratamiento para comenzar tu recuperación física.
          </p>
          <Link href="/reservas/nueva">
            <Button className="mt-2 shadow-lg shadow-teal-500/20">
              Agendar Mi Primera Cita
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reservas.map((reserva) => (
            <div
              key={reserva.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">#{reserva.id}</span>
                  {renderBadge(reserva.estado)}
                  <span className="text-sm font-semibold text-white">
                    {formatDateTime(reserva.fechaHoraInicio)}
                  </span>
                </div>

                <div className="pt-2">
                  <h4 className="text-base font-bold text-white">
                    {reserva.servicios && reserva.servicios.length > 0
                      ? reserva.servicios.map((s) => s.servicioNombre).join(', ')
                      : 'Tratamiento Fisioterapéutico'}
                  </h4>

                  {reserva.notas && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      Nota: &ldquo;{reserva.notas}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal-400" />
                    {formatDuration(duracionReserva(reserva))}
                  </span>
                  {reserva.fisioterapeutaId && fisios[reserva.fisioterapeutaId] && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: fisios[reserva.fisioterapeutaId].color }} />
                        {fisios[reserva.fisioterapeutaId].nombre}
                        {reserva.salaId && salas[reserva.salaId] ? ` · ${salas[reserva.salaId].nombre}` : ''}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>Total: <strong className="text-teal-400">{formatCurrency(reserva.precioTotal)}</strong></span>
                  <span>•</span>
                  <span className={reserva.fechaPago ? 'text-emerald-400' : reserva.estado === 'PENDIENTE_PAGO' ? 'text-amber-400' : ''}>
                    {estadoPago(reserva)}
                    {reserva.pagoReferencia ? ` (${reserva.pagoReferencia})` : ''}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                {reserva.estado === 'PENDIENTE_PAGO' && reserva.ordenCodigo && (
                  <Link href={`/reservas/pago/${reserva.ordenCodigo}`}>
                    <Button size="sm" className="text-xs">Completar pago</Button>
                  </Link>
                )}
                {reserva.estado === 'PROGRAMADA' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingId === reserva.id}
                    onClick={() => handleCancel(reserva.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  >
                    {cancellingId === reserva.id ? 'Cancelando...' : 'Cancelar Cita'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
