'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  LogIn,
  MapPin,
  RefreshCw,
  Timer,
  XCircle,
} from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/format';
import { addDays, duracionReserva, estadoMeta, estadoPago, horaDe, iniciales, nombresServicios, parseISODate, toLocalISODate } from '@/lib/admin';
import { exportarExcel, exportarPDF, nombreArchivo, type Reporte } from '@/lib/export';
import { useClinica, useHoy } from '@/lib/use-clinica';
import { cn } from '@/lib/utils';
import { ExportButtons } from '@/components/ui/export-buttons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/toast';
import { AgendarCitaModal } from '@/components/admin/agendar-modal';
import { CancelarCitaModal } from '@/components/admin/cancelar-modal';
import {
  EmptyState,
  ErrorBanner,
  EstadoBadge,
  FisioTag,
  PageHeader,
  Paginacion,
  SearchInput,
  Segmented,
  SkeletonRows,
  Table,
  Td,
  Th,
} from '@/components/admin/ui';
import type { EstadoReserva, Reserva } from '@/types';

type Filtro = 'TODAS' | EstadoReserva;
type Vista = 'tabla' | 'tarjetas';
type Orden = 'recientes' | 'proximas';

const POR_PAGINA: Record<Vista, number[]> = { tabla: [10, 20, 50], tarjetas: [12, 24, 48] };

export default function AdminReservasPage() {
  const toast = useToast();
  const c = useClinica({ incluirExpiradas: true });
  const hoy = useHoy();
  const [filtro, setFiltro] = useState<Filtro>('TODAS');
  const [search, setSearch] = useState('');
  const [vista, setVista] = useState<Vista>('tabla');
  const [orden, setOrden] = useState<Orden>('recientes');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [actionId, setActionId] = useState<number | null>(null);
  const [toCancel, setToCancel] = useState<Reserva | null>(null);
  const [agendar, setAgendar] = useState(false);

  const counts = useMemo(() => {
    const k = { TODAS: 0, PENDIENTE_PAGO: 0, PROGRAMADA: 0, EN_ATENCION: 0, ATENDIDA: 0, CANCELADA: 0, EXPIRADA: 0 };
    c.reservas.forEach((r) => {
      k[r.estado]++;
      if (r.estado !== 'EXPIRADA') k.TODAS++;
    });
    return k;
  }, [c.reservas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return c.reservas
      .filter((r) => (filtro === 'TODAS' ? r.estado !== 'EXPIRADA' : r.estado === filtro))
      .filter(
        (r) =>
          !q ||
          String(r.id).includes(q) ||
          c.nombrePaciente(r.clienteId).toLowerCase().includes(q) ||
          (r.fisioterapeutaId && c.fisio[r.fisioterapeutaId]?.nombre.toLowerCase().includes(q)) ||
          r.notas?.toLowerCase().includes(q) ||
          r.ordenCodigo?.toLowerCase().includes(q) ||
          r.servicios?.some((s) => s.servicioNombre?.toLowerCase().includes(q))
      )
      .sort((a, b) =>
        orden === 'recientes' ? b.fechaHoraInicio.localeCompare(a.fechaHoraInicio) : a.fechaHoraInicio.localeCompare(b.fechaHoraInicio)
      );
  }, [c, filtro, search, orden]);

  // Si cambia el filtro o se elimina un registro, la página actual se ajusta sola
  const paginas = Math.max(1, Math.ceil(filtered.length / porPagina));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtered.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const cambiarFiltro = (f: Filtro) => {
    setFiltro(f);
    setPagina(1);
  };
  const cambiarVista = (v: Vista) => {
    setVista(v);
    setPorPagina(POR_PAGINA[v][0]);
    setPagina(1);
  };

  // Exporta todo lo filtrado (no solo la página visible)
  const reporte = (): Reporte => {
    const cobrado = filtered.filter((r) => r.estado === 'ATENDIDA' || r.fechaPago).reduce((a, r) => a + Number(r.precioTotal), 0);
    return {
      titulo: 'Reporte de citas',
      subtitulo: `${filtered.length} citas${filtro !== 'TODAS' ? ` · filtro: ${estadoMeta[filtro].label}` : ''}`,
      columnas: ['#', 'Fecha', 'Hora', 'Paciente', 'Tratamiento', 'Fisioterapeuta', 'Sala', 'Estado', 'Pago', 'Orden', 'Total'],
      filas: [...filtered]
        .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
        .map((r) => [
          r.id,
          r.fechaHoraInicio.slice(0, 10),
          horaDe(r.fechaHoraInicio),
          c.nombrePaciente(r.clienteId),
          nombresServicios(r),
          r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId]?.nombre ?? '—' : '—',
          r.salaId ? c.sala[r.salaId]?.nombre ?? '—' : '—',
          estadoMeta[r.estado]?.label ?? r.estado,
          r.pagoReferencia ?? estadoPago(r),
          r.ordenCodigo ?? '—',
          formatCurrency(Number(r.precioTotal)),
        ]),
      resumen: [
        ['Citas', String(filtered.length)],
        ['Pagadas online', String(filtered.filter((r) => r.fechaPago).length)],
        ['Cobrado o prepagado', formatCurrency(cobrado)],
      ],
      archivo: nombreArchivo('citas-fisiomarca'),
    };
  };

  const run = async (r: Reserva, action: () => Promise<{ data: Reserva }>, ok: string) => {
    setActionId(r.id);
    try {
      const res = await action();
      c.upsertReserva(res.data);
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setActionId(null);
    }
  };

  const acciones = (r: Reserva, compacto = false) => {
    const esHoy = r.fechaHoraInicio.slice(0, 10) === hoy;
    const pasada = !!hoy && r.fechaHoraInicio.slice(0, 10) < hoy;
    const items: React.ReactNode[] = [];
    if (r.estado === 'PROGRAMADA' && esHoy)
      items.push(
        <Button key="in" size="sm" variant="secondary" onClick={() => run(r, () => bookingService.checkIn(r.id), 'Llegada registrada')} isLoading={actionId === r.id} className="gap-1.5 text-amber-300">
          <LogIn className="h-3.5 w-3.5" />
          Llegó
        </Button>
      );
    if (r.estado === 'EN_ATENCION' || (r.estado === 'PROGRAMADA' && pasada))
      items.push(
        <Button key="ok" size="sm" variant="secondary" onClick={() => run(r, () => bookingService.markAttended(r.id), `Cita #${r.id} completada`)} isLoading={actionId === r.id} className="gap-1.5 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completar
        </Button>
      );
    if (r.estado === 'PROGRAMADA')
      items.push(
        <Button
          key="x"
          size="sm"
          variant="ghost"
          onClick={() => setToCancel(r)}
          disabled={actionId === r.id}
          aria-label="Cancelar cita"
          className="gap-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <XCircle className="h-3.5 w-3.5" />
          {!compacto && 'Cancelar'}
        </Button>
      );
    return items.length ? <div className="flex justify-end gap-1.5">{items}</div> : <span className="text-xs text-slate-600">—</span>;
  };

  return (
    <>
      <PageHeader
        title="Citas"
        description="Todas las citas de la clínica, con su profesional, sala y estado de pago."
        actions={
          <>
            <ExportButtons disabled={c.loading || filtered.length === 0} onPDF={() => exportarPDF(reporte())} onExcel={() => exportarExcel(reporte(), 'Citas')} />
            <Button variant="secondary" size="sm" onClick={c.refresh} disabled={c.loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${c.loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm" onClick={() => setAgendar(true)} className="hidden gap-2 sm:inline-flex">
              <CalendarPlus className="h-4 w-4" />
              Agendar cita
            </Button>
          </>
        }
      />

      {c.error !== null && <ErrorBanner service="Micro-Reservas" message={c.error} onRetry={c.refresh} />}

      <div className="mb-3">
        <Segmented
          value={filtro}
          onChange={cambiarFiltro}
          options={[
            { value: 'TODAS', label: 'Todas', count: counts.TODAS },
            { value: 'PROGRAMADA', label: 'Pendientes', count: counts.PROGRAMADA },
            { value: 'EN_ATENCION', label: 'En atención', count: counts.EN_ATENCION },
            { value: 'ATENDIDA', label: 'Completadas', count: counts.ATENDIDA },
            { value: 'CANCELADA', label: 'Canceladas', count: counts.CANCELADA },
            { value: 'PENDIENTE_PAGO', label: 'Pago pendiente', count: counts.PENDIENTE_PAGO },
            { value: 'EXPIRADA', label: 'Expiradas', count: counts.EXPIRADA },
          ]}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPagina(1);
          }}
          placeholder="Paciente, profesional, servicio, orden o #ID"
          className="md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <select
            value={orden}
            onChange={(e) => {
              setOrden(e.target.value as Orden);
              setPagina(1);
            }}
            aria-label="Orden"
            className="h-9 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-xs text-slate-200 focus:border-teal-500/60 focus:outline-none"
          >
            <option value="recientes">Más recientes primero</option>
            <option value="proximas">Más antiguas primero</option>
          </select>
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/60 p-1" role="group" aria-label="Vista">
            {(
              [
                { id: 'tabla', icon: List, label: 'Tabla' },
                { id: 'tarjetas', icon: LayoutGrid, label: 'Tarjetas' },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => cambiarVista(v.id)}
                aria-pressed={vista === v.id}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  vista === v.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtro === 'PENDIENTE_PAGO' && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
          <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Son horarios apartados por pacientes que están pagando en este momento. Si no pagan en 10 minutos, pasan solos a “Expiradas” y el horario se libera.
        </p>
      )}

      {vista === 'tabla' ? (
        <Table>
          <thead>
            <tr>
              <Th>Paciente</Th>
              <Th>Fecha</Th>
              <Th>Fisioterapeuta</Th>
              <Th>Tratamiento</Th>
              <Th className="text-right">Total</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {c.loading ? (
              <SkeletonRows cols={7} rows={porPagina > 10 ? 10 : porPagina} />
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Vacio hay={c.reservas.length > 0} />
                </td>
              </tr>
            ) : (
              visibles.map((r) => {
                const nombre = c.nombrePaciente(r.clienteId);
                const esHoy = r.fechaHoraInicio.slice(0, 10) === hoy;
                return (
                  <tr key={r.id} className="transition-colors hover:bg-slate-800/20">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                          {iniciales(nombre)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{nombre}</p>
                          <p className="max-w-[200px] truncate text-xs text-slate-500">
                            #{r.id}
                            {r.notas ? ` · ${r.notas}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <p className="text-slate-200">
                        {formatDateTime(r.fechaHoraInicio)}
                        {esHoy && <span className="ml-2 rounded bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300">HOY</span>}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDuration(duracionReserva(r))}
                      </p>
                    </Td>
                    <Td>
                      <FisioTag fisio={r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId] : null} sala={r.salaId ? c.sala[r.salaId] : null} />
                    </Td>
                    <Td>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {r.servicios?.map((s) => (
                          <span key={s.id} className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300">
                            {s.servicioNombre}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-right font-medium tabular-nums text-white">
                      {formatCurrency(Number(r.precioTotal))}
                      <EstadoPagoTexto r={r} />
                    </Td>
                    <Td>
                      <EstadoBadge estado={r.estado} />
                    </Td>
                    <Td className="text-right">{acciones(r)}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      ) : c.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50">
          <Vacio hay={c.reservas.length > 0} />
        </div>
      ) : (
        <div className="space-y-6">
          {agruparPorDia(visibles).map(([dia, lista]) => (
            <section key={dia}>
              <h2 className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span className={cn(dia === hoy && 'text-teal-300')}>{etiquetaDia(dia, hoy)}</span>
                <span className="h-px flex-1 bg-slate-800" />
                <span className="font-normal normal-case tracking-normal text-slate-600">
                  {lista.length} {lista.length === 1 ? 'cita' : 'citas'}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((r) => {
                  const f = r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId] : undefined;
                  const nombre = c.nombrePaciente(r.clienteId);
                  return (
                    <article
                      key={r.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 transition-colors hover:border-slate-700"
                    >
                      <span className="absolute inset-y-0 left-0 w-1" style={{ background: f?.color ?? '#475569' }} aria-hidden="true" />
                      <div className="flex items-start justify-between gap-3 px-5 pt-4">
                        <div>
                          <p className="text-xl font-bold tabular-nums text-white">
                            {horaDe(r.fechaHoraInicio)}
                            <span className="text-sm font-normal text-slate-500"> – {horaDe(r.fechaHoraFin)}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">#{r.id} · {formatDuration(duracionReserva(r))}</p>
                        </div>
                        <EstadoBadge estado={r.estado} />
                      </div>
                      <div className="flex items-center gap-3 px-5 pt-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                          {iniciales(nombre)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{nombre}</p>
                          <p className="truncate text-xs text-slate-400">{nombresServicios(r)}</p>
                        </div>
                      </div>
                      <p className="flex items-center gap-1.5 px-5 pt-3 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: f?.color ?? '#475569' }} />
                        {f?.nombre ?? 'Sin fisioterapeuta'}
                        <MapPin className="ml-1 h-3 w-3" />
                        {r.salaId ? c.sala[r.salaId]?.nombre : '—'}
                      </p>
                      {r.notas && <p className="mx-5 mt-2 line-clamp-1 text-[11px] italic text-slate-500">“{r.notas}”</p>}
                      <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-800/70 px-5 py-3">
                        <div>
                          <p className="text-base font-bold tabular-nums text-white">{formatCurrency(Number(r.precioTotal))}</p>
                          <EstadoPagoTexto r={r} />
                        </div>
                        {acciones(r, true)}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {!c.loading && filtered.length > 0 && (
        <Paginacion
          pagina={paginaActual}
          total={filtered.length}
          porPagina={porPagina}
          opciones={POR_PAGINA[vista]}
          onPagina={(p) => {
            setPagina(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPorPagina={(n) => {
            setPorPagina(n);
            setPagina(1);
          }}
        />
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAgendar(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-teal-500/30 transition-transform hover:scale-105 active:scale-95"
      >
        <CalendarPlus className="h-5 w-5" />
        <span className="hidden sm:inline">Agendar nueva cita</span>
      </button>

      {hoy && (
        <AgendarCitaModal open={agendar} onClose={() => setAgendar(false)} onCreated={c.upsertReserva} pacientes={c.pacientes} fisios={c.fisios} fechaInicial={hoy} />
      )}

      <CancelarCitaModal
        reserva={toCancel}
        paciente={toCancel ? c.nombrePaciente(toCancel.clienteId) : ''}
        onClose={() => setToCancel(null)}
        onCancelled={c.upsertReserva}
      />
    </>
  );
}

function EstadoPagoTexto({ r }: { r: Reserva }) {
  return (
    <p
      className={cn(
        'mt-0.5 text-[11px] font-normal',
        r.fechaPago ? 'text-emerald-400' : r.estado === 'PENDIENTE_PAGO' ? 'text-amber-400' : 'text-slate-500'
      )}
    >
      {estadoPago(r)}
      {r.estado === 'PENDIENTE_PAGO' && r.expiraEn && ` · vence ${horaDe(r.expiraEn)}`}
    </p>
  );
}

function Vacio({ hay }: { hay: boolean }) {
  return (
    <EmptyState
      icon={CalendarDays}
      title={hay ? 'Sin resultados' : 'Todavía no hay citas'}
      description={hay ? 'Prueba con otro filtro o término de búsqueda.' : 'Agenda la primera con el botón "Agendar cita".'}
    />
  );
}

function agruparPorDia(lista: Reserva[]): [string, Reserva[]][] {
  const grupos = new Map<string, Reserva[]>();
  for (const r of lista) {
    const d = r.fechaHoraInicio.slice(0, 10);
    grupos.set(d, [...(grupos.get(d) ?? []), r]);
  }
  return [...grupos.entries()];
}

function etiquetaDia(iso: string, hoy: string) {
  const fecha = parseISODate(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  if (!hoy) return fecha;
  if (iso === hoy) return `Hoy · ${fecha}`;
  if (iso === toLocalISODate(addDays(parseISODate(hoy), 1))) return `Mañana · ${fecha}`;
  if (iso === toLocalISODate(addDays(parseISODate(hoy), -1))) return `Ayer · ${fecha}`;
  return fecha;
}
