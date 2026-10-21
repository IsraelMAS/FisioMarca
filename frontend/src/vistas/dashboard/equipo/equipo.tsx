'use client';

import { useMemo, useState } from 'react';
import { DoorOpen, Pencil, Plus, RefreshCw, Stethoscope, UserRound } from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { addDays, diaDe, iniciales, inicioSemana, parseISODate, toLocalISODate } from '@/lib/admin';
import { useClinica, useHoy } from '@/lib/use-clinica';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/toast';
import { EmptyState, ErrorBanner, Field, Modal, PageHeader, fieldClass } from '@/components/admin/ui';
import type { Fisioterapeuta, Sala } from '@/types';

const COLORES = ['#2dd4bf', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185', '#34d399', '#f472b6', '#818cf8'];

export default function EquipoPage() {
  const toast = useToast();
  const c = useClinica();
  const hoy = useHoy();
  const [editFisio, setEditFisio] = useState<Partial<Fisioterapeuta> | null>(null);
  const [editSala, setEditSala] = useState<Partial<Sala> | null>(null);
  const [saving, setSaving] = useState(false);

  const carga = useMemo(() => {
    const porFisio: Record<number, { semana: number; hoy: number }> = {};
    const porSala: Record<number, number> = {};
    if (!hoy) return { porFisio, porSala };
    const lunes = toLocalISODate(inicioSemana(parseISODate(hoy)));
    const domingo = toLocalISODate(addDays(parseISODate(lunes), 7));
    for (const r of c.reservas) {
      if (r.estado === 'CANCELADA') continue;
      const d = diaDe(r);
      if (r.fisioterapeutaId) {
        const k = (porFisio[r.fisioterapeutaId] ??= { semana: 0, hoy: 0 });
        if (d >= lunes && d < domingo) k.semana++;
        if (d === hoy) k.hoy++;
      }
      if (r.salaId && d === hoy) porSala[r.salaId] = (porSala[r.salaId] ?? 0) + 1;
    }
    return { porFisio, porSala };
  }, [c.reservas, hoy]);

  const guardarFisio = async (body: Partial<Fisioterapeuta>, id?: number, msg = 'Fisioterapeuta guardado') => {
    setSaving(true);
    try {
      const res = await bookingService.saveTherapist(body, id);
      c.setFisios((prev) => (id ? prev.map((f) => (f.id === id ? res.data : f)) : [...prev, res.data]));
      toast.success(msg);
      setEditFisio(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const guardarSala = async (body: Partial<Sala>, id?: number, msg = 'Sala guardada') => {
    setSaving(true);
    try {
      const res = await bookingService.saveRoom(body, id);
      c.setSalas((prev) => (id ? prev.map((s) => (s.id === id ? res.data : s)) : [...prev, res.data]));
      toast.success(msg);
      setEditSala(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Equipo y salas"
        description="Los fisioterapeutas y salas activos definen cuántas citas simultáneas acepta la clínica."
        actions={
          <Button variant="secondary" size="sm" onClick={c.refresh} disabled={c.loading} aria-label="Actualizar">
            <RefreshCw className={`h-4 w-4 ${c.loading ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      {c.error !== null && <ErrorBanner service="Micro-Reservas" message={c.error} onRetry={c.refresh} />}

      {/* Fisioterapeutas */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Stethoscope className="h-4 w-4 text-teal-400" /> Fisioterapeutas
          <span className="text-xs font-normal text-slate-500">{c.fisios.filter((f) => f.activo).length} activos</span>
        </h2>
        <Button size="sm" className="gap-1.5" onClick={() => setEditFisio({ nombre: '', especialidad: '', color: COLORES[c.fisios.length % COLORES.length], activo: true })}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {c.loading
          ? [0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-800/40" />)
          : c.fisios.length === 0
            ? <div className="col-span-full"><EmptyState icon={UserRound} title="Aún no hay fisioterapeutas" /></div>
            : c.fisios.map((f) => {
                const k = carga.porFisio[f.id] ?? { semana: 0, hoy: 0 };
                return (
                  <div key={f.id} className={cn('rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition-opacity', !f.activo && 'opacity-50')}>
                    <div className="flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold" style={{ background: `${f.color}22`, color: f.color }}>
                        {iniciales(f.nombre.replace('Lic. ', ''))}
                      </span>
                      <button onClick={() => setEditFisio(f)} aria-label="Editar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 truncate font-semibold text-white">{f.nombre}</p>
                    <p className="truncate text-xs text-slate-500">{f.especialidad || 'Fisioterapia general'}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-xl bg-slate-950/50 py-2">
                        <p className="text-lg font-bold tabular-nums text-white">{k.hoy}</p>
                        <p className="text-[10px] text-slate-500">hoy</p>
                      </div>
                      <div className="rounded-xl bg-slate-950/50 py-2">
                        <p className="text-lg font-bold tabular-nums text-white">{k.semana}</p>
                        <p className="text-[10px] text-slate-500">esta semana</p>
                      </div>
                    </div>
                    <Toggle
                      on={f.activo}
                      label={f.activo ? 'Activo' : 'Inactivo'}
                      onChange={() => guardarFisio({ ...f, activo: !f.activo }, f.id, f.activo ? `${f.nombre} desactivado` : `${f.nombre} activado`)}
                    />
                  </div>
                );
              })}
      </div>

      {/* Salas */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <DoorOpen className="h-4 w-4 text-teal-400" /> Salas
          <span className="text-xs font-normal text-slate-500">{c.salas.filter((s) => s.activo).length} activas</span>
        </h2>
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setEditSala({ nombre: '', tipo: '', activo: true })}>
          <Plus className="h-4 w-4" /> Nueva sala
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {c.loading
          ? [0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-800/40" />)
          : c.salas.map((s) => (
              <div key={s.id} className={cn('rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5', !s.activo && 'opacity-50')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{s.nombre}</p>
                    <p className="truncate text-xs text-slate-500">{s.tipo || 'Sala'}</p>
                  </div>
                  <button onClick={() => setEditSala(s)} aria-label="Editar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  <span className="text-lg font-bold tabular-nums text-white">{carga.porSala[s.id] ?? 0}</span> citas hoy
                </p>
                <Toggle
                  on={s.activo}
                  label={s.activo ? 'Disponible' : 'Fuera de servicio'}
                  onChange={() => guardarSala({ ...s, activo: !s.activo }, s.id, s.activo ? `${s.nombre} fuera de servicio` : `${s.nombre} disponible`)}
                />
              </div>
            ))}
      </div>

      <Modal open={!!editFisio} onClose={() => setEditFisio(null)} title={editFisio?.id ? 'Editar fisioterapeuta' : 'Nuevo fisioterapeuta'} icon={Stethoscope}>
        {editFisio && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarFisio(editFisio, editFisio.id);
            }}
            className="space-y-4"
          >
            <Field label="Nombre">
              <input value={editFisio.nombre ?? ''} onChange={(e) => setEditFisio({ ...editFisio, nombre: e.target.value })} required className={fieldClass} placeholder="Lic. Nombre Apellido" />
            </Field>
            <Field label="Especialidad">
              <input value={editFisio.especialidad ?? ''} onChange={(e) => setEditFisio({ ...editFisio, especialidad: e.target.value })} className={fieldClass} placeholder="Ej. Traumatología deportiva" />
            </Field>
            <Field label="Color en la agenda">
              <div className="flex flex-wrap gap-2">
                {COLORES.map((col) => (
                  <button
                    type="button"
                    key={col}
                    onClick={() => setEditFisio({ ...editFisio, color: col })}
                    aria-label={col}
                    className={cn('h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-slate-900 transition-transform', editFisio.color === col ? 'scale-110 ring-white' : 'ring-transparent')}
                    style={{ background: col }}
                  />
                ))}
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditFisio(null)}>Cancelar</Button>
              <Button type="submit" size="sm" isLoading={saving}>Guardar</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!editSala} onClose={() => setEditSala(null)} title={editSala?.id ? 'Editar sala' : 'Nueva sala'} icon={DoorOpen}>
        {editSala && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarSala(editSala, editSala.id);
            }}
            className="space-y-4"
          >
            <Field label="Nombre">
              <input value={editSala.nombre ?? ''} onChange={(e) => setEditSala({ ...editSala, nombre: e.target.value })} required className={fieldClass} placeholder="Ej. Box 3" />
            </Field>
            <Field label="Tipo">
              <input value={editSala.tipo ?? ''} onChange={(e) => setEditSala({ ...editSala, tipo: e.target.value })} className={fieldClass} placeholder="Ej. Camilla individual" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditSala(null)}>Cancelar</Button>
              <Button type="submit" size="sm" isLoading={saving}>Guardar</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button onClick={onChange} className="mt-4 flex w-full items-center justify-between text-xs text-slate-400">
      {label}
      <span className={cn('relative h-5 w-9 rounded-full transition-colors', on ? 'bg-teal-500' : 'bg-slate-700')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', on ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  );
}
