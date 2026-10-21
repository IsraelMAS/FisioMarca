'use client';

import { useMemo, useRef, useState } from 'react';
import { bookingService } from '@/lib/api/booking.service';
import { useToast } from '@/components/admin/toast';
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, RefreshCw, Stethoscope } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { addDays, diaDe, horaDe, inicioSemana, nombresServicios, parseISODate, toLocalISODate } from '@/lib/admin';
import { useClinica, useHoy } from '@/lib/use-clinica';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AgendarCitaModal } from '@/components/admin/agendar-modal';
import { ErrorBanner, EstadoBadge, Modal, PageHeader } from '@/components/admin/ui';
import type { Reserva } from '@/types';

const HORA_INI = 7;
const HORA_FIN = 19;
const PX_HORA = 56;
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const minutos = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));

// Reparte en carriles las citas simultáneas (varios fisioterapeutas a la vez)
function carriles(citas: Reserva[]) {
  const orden = [...citas].sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio));
  const fines: string[] = [];
  const pos = new Map<number, number>();
  for (const r of orden) {
    let lane = fines.findIndex((fin) => fin <= r.fechaHoraInicio);
    if (lane === -1) {
      lane = fines.length;
      fines.push(r.fechaHoraFin);
    } else fines[lane] = r.fechaHoraFin;
    pos.set(r.id, lane);
  }
  return { pos, total: Math.max(1, fines.length) };
}

const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export default function AgendaPage() {
  const c = useClinica();
  const hoy = useHoy();
  const toast = useToast();
  const [offset, setOffset] = useState(0);
  const [ocultos, setOcultos] = useState<number[]>([]);
  const [detalle, setDetalle] = useState<Reserva | null>(null);
  const [agendar, setAgendar] = useState(false);
  const [destino, setDestino] = useState<{ iso: string; min: number; dur: number } | null>(null);
  const [moviendo, setMoviendo] = useState<number | null>(null);
  const arrastre = useRef<{ reserva: Reserva; agarre: number; dur: number } | null>(null);

  const puedeMover = (r: Reserva) => r.estado === 'PROGRAMADA' && !!hoy && diaDe(r) >= hoy;

  // Minuto de inicio (cada 30 min) según dónde está el puntero dentro de la columna
  const minutoEn = (e: React.DragEvent<HTMLDivElement>) => {
    const a = arrastre.current!;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const crudo = HORA_INI * 60 + (y / PX_HORA) * 60 - a.agarre;
    const redondeado = Math.round(crudo / 30) * 30;
    return Math.min(Math.max(redondeado, HORA_INI * 60), HORA_FIN * 60 - a.dur);
  };

  const soltar = async (iso: string, min: number) => {
    const a = arrastre.current;
    arrastre.current = null;
    setDestino(null);
    if (!a) return;
    const r = a.reserva;
    if (diaDe(r) === iso && minutos(r.fechaHoraInicio) === min) return;
    setMoviendo(r.id);
    try {
      const res = await bookingService.reschedule(r.id, { fechaHoraInicio: `${iso}T${aHora(min)}:00` });
      c.upsertReserva(res.data);
      const dia = parseISODate(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric' });
      toast.success(`Cita de ${c.nombrePaciente(r.clienteId)} movida al ${dia}, ${aHora(min)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reprogramar la cita');
    } finally {
      setMoviendo(null);
    }
  };

  const semana = useMemo(() => {
    if (!hoy) return null;
    const lunes = addDays(inicioSemana(parseISODate(hoy)), offset * 7);
    return DIAS.map((label, i) => {
      const f = addDays(lunes, i);
      const iso = toLocalISODate(f);
      const citas = c.reservas.filter(
        (r) => diaDe(r) === iso && r.estado !== 'CANCELADA' && !ocultos.includes(r.fisioterapeutaId ?? -1)
      );
      return { label, iso, dia: f.getDate(), citas, ...carriles(citas) };
    });
  }, [hoy, offset, c.reservas, ocultos]);

  const titulo = semana
    ? `${parseISODate(semana[0].iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} – ${parseISODate(
        semana[5].iso
      ).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : '';

  const totalSemana = semana?.reduce((a, d) => a + d.citas.length, 0) ?? 0;
  const horas = Array.from({ length: HORA_FIN - HORA_INI }, (_, i) => HORA_INI + i);

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Vista semanal de las citas por fisioterapeuta."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={c.refresh} disabled={c.loading} aria-label="Actualizar">
              <RefreshCw className={`h-4 w-4 ${c.loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => setAgendar(true)} className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Agendar cita
            </Button>
          </>
        }
      />

      {c.error !== null && <ErrorBanner service="Micro-Reservas" message={c.error} onRetry={c.refresh} />}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
            <button onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOffset(0)}
              className={cn('rounded-lg px-3 text-xs font-medium', offset === 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
            >
              Hoy
            </button>
            <button onClick={() => setOffset((o) => o + 1)} aria-label="Semana siguiente" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold capitalize text-white">{titulo}</p>
            <p className="text-xs text-slate-500">
              {totalSemana} citas esta semana · <span className="hidden sm:inline">arrastra una cita pendiente para reprogramarla</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {c.fisios
            .filter((f) => f.activo)
            .map((f) => {
              const off = ocultos.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => setOcultos((prev) => (off ? prev.filter((x) => x !== f.id) : [...prev, f.id]))}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all',
                    off ? 'border-slate-800 text-slate-600 line-through' : 'border-slate-700 text-slate-300'
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: off ? '#475569' : f.color }} />
                  {f.nombre.replace('Lic. ', '')}
                </button>
              );
            })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/50">
        <div className="min-w-[760px]">
          {/* Cabecera de días */}
          <div className="grid grid-cols-[56px_repeat(6,1fr)] border-b border-slate-800/80">
            <div />
            {(semana ?? DIAS.map((label) => ({ label, iso: label, dia: 0 }))).map((d) => {
              const esHoy = d.iso === hoy;
              return (
                <div key={d.iso} className="border-l border-slate-800/60 px-2 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{d.label}</p>
                  <p
                    className={cn(
                      'mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                      esHoy ? 'bg-teal-500 text-white' : 'text-slate-200'
                    )}
                  >
                    {d.dia || ''}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Cuerpo */}
          <div className="relative grid grid-cols-[56px_repeat(6,1fr)]" style={{ height: horas.length * PX_HORA }}>
            <div className="relative">
              {horas.map((h, i) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-slate-500" style={{ top: i * PX_HORA }}>
                  {i === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                </span>
              ))}
            </div>
            {(semana ?? []).map((d) => (
              <div
                key={d.iso}
                className={cn('relative border-l border-slate-800/60', d.iso === hoy && 'bg-teal-500/[0.03]')}
                onDragOver={(e) => {
                  if (!arrastre.current) return;
                  e.preventDefault();
                  const min = minutoEn(e);
                  if (destino?.iso !== d.iso || destino.min !== min) setDestino({ iso: d.iso, min, dur: arrastre.current.dur });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (arrastre.current) soltar(d.iso, minutoEn(e));
                }}
              >
                {horas.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-slate-800/50" style={{ top: i * PX_HORA }} />
                ))}
                {/* Pausa del mediodía */}
                <div
                  className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(148,163,184,0.05)_6px,rgba(148,163,184,0.05)_12px)]"
                  style={{ top: (12 - HORA_INI) * PX_HORA, height: 2 * PX_HORA }}
                />
                {/* Vista previa del destino al arrastrar */}
                {destino?.iso === d.iso && (
                  <div
                    className="pointer-events-none absolute inset-x-1 z-20 flex items-start justify-center rounded-lg border-2 border-dashed border-teal-400 bg-teal-400/10 pt-1"
                    style={{
                      top: ((destino.min - HORA_INI * 60) / 60) * PX_HORA,
                      height: (destino.dur / 60) * PX_HORA - 2,
                    }}
                  >
                    <span className="rounded bg-teal-500 px-1.5 text-[10px] font-semibold tabular-nums text-white">
                      {aHora(destino.min)}–{aHora(destino.min + destino.dur)}
                    </span>
                  </div>
                )}
                {d.citas.map((r) => {
                  const f = r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId] : undefined;
                  const color = f?.color ?? '#64748b';
                  const top = ((minutos(r.fechaHoraInicio) - HORA_INI * 60) / 60) * PX_HORA;
                  const alto = Math.max(22, ((minutos(r.fechaHoraFin) - minutos(r.fechaHoraInicio)) / 60) * PX_HORA - 2);
                  const lane = d.pos.get(r.id) ?? 0;
                  const movible = puedeMover(r);
                  return (
                    <button
                      key={r.id}
                      onClick={() => setDetalle(r)}
                      draggable={movible}
                      onDragStart={(e) => {
                        const agarre = ((e.clientY - e.currentTarget.getBoundingClientRect().top) / PX_HORA) * 60;
                        arrastre.current = { reserva: r, agarre, dur: minutos(r.fechaHoraFin) - minutos(r.fechaHoraInicio) };
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(r.id));
                      }}
                      onDragEnd={() => {
                        arrastre.current = null;
                        setDestino(null);
                      }}
                      title={movible ? 'Arrastra para reprogramar' : undefined}
                      className={cn(
                        'absolute overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left transition-transform hover:z-10 hover:scale-[1.03]',
                        movible && 'cursor-grab active:cursor-grabbing',
                        moviendo === r.id && 'animate-pulse opacity-60'
                      )}
                      style={{
                        top,
                        height: alto,
                        left: `calc(${(lane / d.total) * 100}% + 2px)`,
                        width: `calc(${100 / d.total}% - 4px)`,
                        background: `${color}26`,
                        borderColor: color,
                      }}
                    >
                      <p className="truncate text-[10px] font-semibold tabular-nums" style={{ color }}>
                        {horaDe(r.fechaHoraInicio)}
                        {r.estado === 'EN_ATENCION' && ' · en sala'}
                        {r.estado === 'ATENDIDA' && ' ✓'}
                      </p>
                      <p className="truncate text-[11px] font-medium text-white">{c.nombrePaciente(r.clienteId)}</p>
                      {alto > 44 && <p className="truncate text-[10px] text-slate-400">{nombresServicios(r)}</p>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={detalle ? c.nombrePaciente(detalle.clienteId) : ''} description={detalle ? `Cita #${detalle.id}` : ''}>
        {detalle && (
          <div className="space-y-3 text-sm">
            <EstadoBadge estado={detalle.estado} />
            <p className="flex items-center gap-2 text-slate-300">
              <Clock className="h-4 w-4 text-slate-500" />
              {parseISODate(diaDe(detalle)).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {horaDe(detalle.fechaHoraInicio)}–{horaDe(detalle.fechaHoraFin)}
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Stethoscope className="h-4 w-4 text-slate-500" />
              {detalle.fisioterapeutaId ? c.fisio[detalle.fisioterapeutaId]?.nombre : 'Sin fisioterapeuta'}
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-slate-500" />
              {detalle.salaId ? c.sala[detalle.salaId]?.nombre : 'Sin sala'}
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-slate-300">{nombresServicios(detalle)}</p>
              <p className="mt-1 font-semibold text-white">{formatCurrency(Number(detalle.precioTotal))}</p>
              {detalle.notas && <p className="mt-2 text-xs text-slate-500">{detalle.notas}</p>}
            </div>
            <p className="text-xs text-slate-500">Check-in, cancelación y reasignación se gestionan en Transacciones.</p>
          </div>
        )}
      </Modal>

      {hoy && (
        <AgendarCitaModal
          open={agendar}
          onClose={() => setAgendar(false)}
          onCreated={c.upsertReserva}
          pacientes={c.pacientes}
          fisios={c.fisios}
          fechaInicial={hoy}
        />
      )}
    </>
  );
}
