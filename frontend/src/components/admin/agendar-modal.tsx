'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check } from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { catalogService } from '@/lib/api/catalog.service';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Modal, fieldClass } from '@/components/admin/ui';
import { useToast } from '@/components/admin/toast';
import type { AdminUser, Fisioterapeuta, Reserva, Servicio, SlotDisponibilidad } from '@/types';

export function AgendarCitaModal({
  open,
  onClose,
  onCreated,
  pacientes,
  fisios,
  fechaInicial,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (r: Reserva) => void;
  pacientes: AdminUser[];
  fisios: Fisioterapeuta[];
  fechaInicial: string;
}) {
  const toast = useToast();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [servicioIds, setServicioIds] = useState<number[]>([]);
  const [fecha, setFecha] = useState(fechaInicial);
  const [fisioId, setFisioId] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || servicios.length) return;
    catalogService
      .getAllServices()
      .then((res) => setServicios((res.data ?? []).filter((s) => s.activo)))
      .catch(() => toast.error('No se pudo cargar el catálogo de servicios'));
  }, [open, servicios.length, toast]);

  // Horarios libres según fecha y servicios elegidos
  useEffect(() => {
    if (!open || !fecha || servicioIds.length === 0) return;
    let cancel = false;
    bookingService
      .checkAvailability(fecha, servicioIds)
      .then((res) => !cancel && setSlots(res.data?.horarios ?? []))
      .catch(() => !cancel && setSlots([]))
      .finally(() => !cancel && setLoadingSlots(false));
    return () => {
      cancel = true;
    };
  }, [open, fecha, servicioIds]);

  const seleccion = useMemo(() => servicios.filter((s) => servicioIds.includes(s.id)), [servicios, servicioIds]);
  const total = seleccion.reduce((a, s) => a + Number(s.precio), 0);
  const duracion = seleccion.reduce((a, s) => a + (s.duracionMinutos || 45), 0);

  const toggleServicio = (id: number) => {
    setHora('');
    setLoadingSlots(true);
    setServicioIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const reset = () => {
    setClienteId('');
    setServicioIds([]);
    setFisioId('');
    setHora('');
    setNotas('');
    setSlots([]);
  };

  const submit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!clienteId || servicioIds.length === 0 || !fecha || !hora) {
      toast.error('Completa paciente, servicios, fecha y horario');
      return;
    }
    setSaving(true);
    try {
      const res = await bookingService.create({
        clienteId: Number(clienteId),
        servicioIds,
        fechaHoraInicio: `${fecha}T${hora}:00`,
        notas: notas.trim() || undefined,
        fisioterapeutaId: fisioId ? Number(fisioId) : undefined,
      });
      toast.success('Cita agendada correctamente');
      onCreated(res.data);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo agendar la cita');
    } finally {
      setSaving(false);
    }
  };

  const libres = slots.filter((s) => s.disponible);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agendar nueva cita"
      description="El sistema asigna fisioterapeuta y sala libres si no eliges uno."
      icon={CalendarPlus}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Paciente">
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={fieldClass} required>
            <option value="">Selecciona un paciente…</option>
            {pacientes.map((p) => (
              <option key={p.clienteId!} value={p.clienteId!}>
                {p.nombreCompleto} — {p.email}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tratamientos">
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
            {servicios.length === 0 && <span className="p-1 text-xs text-slate-500">Cargando servicios…</span>}
            {servicios.map((s) => {
              const on = servicioIds.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleServicio(s.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors',
                    on
                      ? 'border-teal-500/50 bg-teal-500/15 text-teal-200'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  )}
                >
                  {on && <Check className="h-3 w-3" />}
                  {s.nombre}
                </button>
              );
            })}
          </div>
          {seleccion.length > 0 && (
            <span className="mt-1 block text-[11px] text-slate-500">
              {formatDuration(duracion)} · {formatCurrency(total)}
            </span>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha">
            <input
              type="date"
              value={fecha}
              min={fechaInicial}
              onChange={(e) => {
                setHora('');
                setLoadingSlots(true);
                setFecha(e.target.value);
              }}
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Fisioterapeuta">
            <select value={fisioId} onChange={(e) => setFisioId(e.target.value)} className={fieldClass}>
              <option value="">Asignar automáticamente</option>
              {fisios
                .filter((f) => f.activo)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <Field label="Horario" hint="Turnos: 07:00–12:00 y 14:00–19:00">
          {servicioIds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 p-3 text-xs text-slate-500">
              Elige al menos un tratamiento para ver los horarios.
            </p>
          ) : loadingSlots ? (
            <div className="h-20 animate-pulse rounded-xl bg-slate-800/50" />
          ) : libres.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 p-3 text-xs text-slate-500">
              No hay horarios libres ese día. Prueba con otra fecha.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {libres.map((s) => (
                <button
                  type="button"
                  key={s.hora}
                  onClick={() => setHora(s.hora)}
                  className={cn(
                    'rounded-lg border py-1.5 text-xs font-medium tabular-nums transition-colors',
                    hora === s.hora
                      ? 'border-teal-400 bg-teal-500 text-white'
                      : 'border-slate-800 text-slate-300 hover:border-teal-500/50'
                  )}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Notas (opcional)">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Motivo de consulta, indicaciones…"
            className={fieldClass}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={saving}>
            Agendar cita
          </Button>
        </div>
      </form>
    </Modal>
  );
}
