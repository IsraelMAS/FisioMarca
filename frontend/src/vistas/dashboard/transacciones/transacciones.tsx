'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Clock, DoorOpen, LogIn, RefreshCw, UserCheck, XCircle } from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { formatDateTime } from '@/lib/format';
import { diaDe, horaDe, nombresServicios, seCruzan } from '@/lib/admin';
import { useClinica, useHoy } from '@/lib/use-clinica';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/toast';
import { CancelarCitaModal } from '@/components/admin/cancelar-modal';
import {
  EmptyState,
  ErrorBanner,
  EstadoBadge,
  Field,
  FisioTag,
  PageHeader,
  Panel,
  SearchInput,
  Segmented,
  StatCard,
  fieldClass,
} from '@/components/admin/ui';
import type { Reserva } from '@/types';

type Tab = 'checkin' | 'cancelacion' | 'reasignacion';

export default function TransaccionesPage() {
  const toast = useToast();
  const c = useClinica();
  const hoy = useHoy();
  const [tab, setTab] = useState<Tab>('checkin');
  const [actionId, setActionId] = useState<number | null>(null);
  const [toCancel, setToCancel] = useState<Reserva | null>(null);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<Reserva | null>(null);
  const [nuevoFisio, setNuevoFisio] = useState('');
  const [nuevaSala, setNuevaSala] = useState('');
  const [saving, setSaving] = useState(false);

  const grupos = useMemo(() => {
    const deHoy = c.reservas
      .filter((r) => diaDe(r) === hoy)
      .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio));
    const futuras = c.reservas
      .filter((r) => diaDe(r) >= hoy && (r.estado === 'PROGRAMADA' || r.estado === 'EN_ATENCION'))
      .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio));
    return {
      porLlegar: deHoy.filter((r) => r.estado === 'PROGRAMADA'),
      enAtencion: c.reservas.filter((r) => r.estado === 'EN_ATENCION'),
      despachadas: deHoy.filter((r) => r.estado === 'ATENDIDA'),
      canceladasHoy: deHoy.filter((r) => r.estado === 'CANCELADA'),
      futuras,
    };
  }, [c.reservas, hoy]);

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

  const filtrar = (lista: Reserva[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (r) =>
        String(r.id).includes(q) ||
        c.nombrePaciente(r.clienteId).toLowerCase().includes(q) ||
        nombresServicios(r).toLowerCase().includes(q)
    );
  };

  // Recursos ocupados en el horario de la cita seleccionada
  const ocupados = useMemo(() => {
    const fisios = new Map<number, number>();
    const salas = new Map<number, number>();
    if (sel) {
      for (const r of c.reservas) {
        if (r.id === sel.id || r.estado === 'CANCELADA' || !seCruzan(r, sel)) continue;
        if (r.fisioterapeutaId) fisios.set(r.fisioterapeutaId, r.id);
        if (r.salaId) salas.set(r.salaId, r.id);
      }
    }
    return { fisios, salas };
  }, [sel, c.reservas]);

  const elegir = (r: Reserva) => {
    setSel(r);
    setNuevoFisio(r.fisioterapeutaId ? String(r.fisioterapeutaId) : '');
    setNuevaSala(r.salaId ? String(r.salaId) : '');
  };

  const reasignar = async () => {
    if (!sel) return;
    const body: { fisioterapeutaId?: number; salaId?: number } = {};
    if (nuevoFisio && Number(nuevoFisio) !== sel.fisioterapeutaId) body.fisioterapeutaId = Number(nuevoFisio);
    if (nuevaSala && Number(nuevaSala) !== sel.salaId) body.salaId = Number(nuevaSala);
    if (!body.fisioterapeutaId && !body.salaId) {
      toast.error('Elige un fisioterapeuta o una sala distintos a los actuales');
      return;
    }
    setSaving(true);
    try {
      const res = await bookingService.reassign(sel.id, body);
      c.upsertReserva(res.data);
      setSel(res.data);
      toast.success(`Cita #${sel.id} reasignada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reasignar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Transacciones"
        description="Operaciones del día: llegada de pacientes, despacho, cancelaciones y reasignaciones."
        actions={
          <Button variant="secondary" size="sm" onClick={c.refresh} disabled={c.loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${c.loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        }
      />

      {c.error !== null && <ErrorBanner service="Micro-Reservas" message={c.error} onRetry={c.refresh} />}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Por llegar hoy" value={grupos.porLlegar.length} icon={Clock} tone="sky" loading={c.loading} />
        <StatCard label="En atención" value={grupos.enAtencion.length} icon={UserCheck} tone="amber" loading={c.loading} />
        <StatCard label="Despachados hoy" value={grupos.despachadas.length} icon={CheckCircle2} tone="emerald" loading={c.loading} />
        <StatCard label="Cancelados hoy" value={grupos.canceladasHoy.length} icon={XCircle} tone="rose" loading={c.loading} />
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'checkin', label: 'Check-in / Despacho' },
            { value: 'cancelacion', label: 'Cancelación' },
            { value: 'reasignacion', label: 'Reasignación' },
          ]}
        />
        {tab !== 'checkin' && <SearchInput value={search} onChange={setSearch} placeholder="Buscar paciente o #ID" />}
      </div>

      {tab === 'checkin' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Por llegar" description="Citas de hoy pendientes de check-in">
            <Lista
              items={grupos.porLlegar}
              loading={c.loading}
              vacio="No quedan pacientes por llegar hoy"
              render={(r) => (
                <Fila r={r} c={c}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-amber-300"
                    isLoading={actionId === r.id}
                    onClick={() => run(r, () => bookingService.checkIn(r.id), `${c.nombrePaciente(r.clienteId)} registró su llegada`)}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Registrar llegada
                  </Button>
                </Fila>
              )}
            />
          </Panel>
          <Panel title="En atención" description="Pacientes dentro de la clínica">
            <Lista
              items={grupos.enAtencion}
              loading={c.loading}
              vacio="Nadie está en atención ahora"
              render={(r) => (
                <Fila r={r} c={c} extra={r.horaLlegada ? `Llegó ${horaDe(r.horaLlegada)}` : undefined}>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    isLoading={actionId === r.id}
                    onClick={() => run(r, () => bookingService.markAttended(r.id), 'Sesión finalizada y paciente despachado')}
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                    Finalizar y despachar
                  </Button>
                </Fila>
              )}
            />
          </Panel>
        </div>
      )}

      {tab === 'cancelacion' && (
        <Panel title="Citas cancelables" description="Solo las citas pendientes pueden cancelarse">
          <Lista
            items={filtrar(grupos.futuras.filter((r) => r.estado === 'PROGRAMADA'))}
            loading={c.loading}
            vacio="No hay citas pendientes"
            render={(r) => (
              <Fila r={r} c={c} conFecha>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  onClick={() => setToCancel(r)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelar
                </Button>
              </Fila>
            )}
          />
        </Panel>
      )}

      {tab === 'reasignacion' && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel title="Elige una cita" className="lg:col-span-3">
            <Lista
              items={filtrar(grupos.futuras)}
              loading={c.loading}
              vacio="No hay citas para reasignar"
              render={(r) => (
                <button
                  onClick={() => elegir(r)}
                  className={cn(
                    '-mx-2 block w-[calc(100%+1rem)] rounded-xl px-2 text-left transition-colors',
                    sel?.id === r.id ? 'bg-teal-500/10 ring-1 ring-teal-500/30' : 'hover:bg-slate-800/40'
                  )}
                >
                  <Fila r={r} c={c} conFecha />
                </button>
              )}
            />
          </Panel>

          <Panel title="Reasignar" description="Cambia profesional o sala de la cita" className="lg:col-span-2">
            {!sel ? (
              <EmptyState icon={ArrowLeftRight} title="Selecciona una cita" description="Verás qué profesionales y salas están libres en ese horario." />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
                  <p className="font-medium text-white">{c.nombrePaciente(sel.clienteId)}</p>
                  <p className="mt-1 text-slate-400">
                    {formatDateTime(sel.fechaHoraInicio)} – {horaDe(sel.fechaHoraFin)}
                  </p>
                  <div className="mt-3">
                    <FisioTag fisio={sel.fisioterapeutaId ? c.fisio[sel.fisioterapeutaId] : null} sala={sel.salaId ? c.sala[sel.salaId] : null} />
                  </div>
                </div>
                <Field label="Nuevo fisioterapeuta">
                  <select value={nuevoFisio} onChange={(e) => setNuevoFisio(e.target.value)} className={fieldClass}>
                    <option value="">Sin cambio</option>
                    {c.fisios
                      .filter((f) => f.activo)
                      .map((f) => (
                        <option key={f.id} value={f.id} disabled={ocupados.fisios.has(f.id)}>
                          {f.nombre}
                          {f.id === sel.fisioterapeutaId ? ' (actual)' : ocupados.fisios.has(f.id) ? ` — ocupado (#${ocupados.fisios.get(f.id)})` : ' — libre'}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Nueva sala">
                  <select value={nuevaSala} onChange={(e) => setNuevaSala(e.target.value)} className={fieldClass}>
                    <option value="">Sin cambio</option>
                    {c.salas
                      .filter((s) => s.activo)
                      .map((s) => (
                        <option key={s.id} value={s.id} disabled={ocupados.salas.has(s.id)}>
                          {s.nombre}
                          {s.id === sel.salaId ? ' (actual)' : ocupados.salas.has(s.id) ? ' — ocupada' : ' — libre'}
                        </option>
                      ))}
                  </select>
                </Field>
                <Button onClick={reasignar} isLoading={saving} className="w-full gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Confirmar reasignación
                </Button>
              </div>
            )}
          </Panel>
        </div>
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

function Lista({
  items,
  loading,
  vacio,
  render,
}: {
  items: Reserva[];
  loading: boolean;
  vacio: string;
  render: (r: Reserva) => React.ReactNode;
}) {
  if (loading)
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800/40" />
        ))}
      </div>
    );
  if (items.length === 0) return <EmptyState title={vacio} />;
  return (
    <ul className="-my-2 divide-y divide-slate-800/70">
      {items.map((r) => (
        <li key={r.id} className="py-2">
          {render(r)}
        </li>
      ))}
    </ul>
  );
}

function Fila({
  r,
  c,
  conFecha,
  extra,
  children,
}: {
  r: Reserva;
  c: ReturnType<typeof useClinica>;
  conFecha?: boolean;
  extra?: string;
  children?: React.ReactNode;
}) {
  const fisio = r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId] : null;
  return (
    <div className="flex flex-col gap-3 py-1.5 sm:flex-row sm:items-center">
      <span
        className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-semibold tabular-nums ring-1"
        style={{ background: `${fisio?.color ?? '#64748b'}1a`, color: fisio?.color ?? '#94a3b8', borderColor: fisio?.color }}
      >
        {horaDe(r.fechaHoraInicio)}
        {conFecha && (
          <span className="text-[9px] font-normal opacity-80">
            {r.fechaHoraInicio.slice(8, 10)}/{r.fechaHoraInicio.slice(5, 7)}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-white">
          {c.nombrePaciente(r.clienteId)}
          <span className="text-xs font-normal text-slate-600">#{r.id}</span>
        </p>
        <p className="truncate text-xs text-slate-500">
          {nombresServicios(r)} · {fisio?.nombre ?? 'Sin fisioterapeuta'}
          {r.salaId && c.sala[r.salaId] ? ` · ${c.sala[r.salaId].nombre}` : ''}
          {extra ? ` · ${extra}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!children && <EstadoBadge estado={r.estado} />}
        {children}
      </div>
    </div>
  );
}
