'use client';

import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, FilePlus2, HeartPulse, Mail, Wallet } from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { diaDe, estadoMeta, iniciales, nombresServicios } from '@/lib/admin';
import { exportarExcel, exportarPDF, nombreArchivo, type Reporte } from '@/lib/export';
import { ExportButtons } from '@/components/ui/export-buttons';
import { useClinica, useHoy } from '@/lib/use-clinica';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/toast';
import { EmptyState, ErrorBanner, EstadoBadge, Field, Modal, PageHeader, Panel, SearchInput, fieldClass } from '@/components/admin/ui';
import type { AdminUser, NotaClinica } from '@/types';

function colorDolor(n: number) {
  if (n <= 3) return '#34d399';
  if (n <= 6) return '#fbbf24';
  return '#fb7185';
}

export default function HistorialPage() {
  const toast = useToast();
  const c = useClinica();
  const hoy = useHoy();
  const [search, setSearch] = useState('');
  const [paciente, setPaciente] = useState<AdminUser | null>(null);
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [modal, setModal] = useState(false);

  const pacientes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return c.pacientes
      .filter((p) => p.rol === 'CLIENTE')
      .filter((p) => !q || p.nombreCompleto.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [c.pacientes, search]);

  const cargarNotas = useCallback(
    async (clienteId: number) => {
      try {
        const res = await bookingService.getHistory(clienteId);
        setNotas(res.data ?? []);
      } catch (err) {
        setNotas([]);
        toast.error(err instanceof Error ? err.message : 'No se pudo cargar el historial');
      } finally {
        setLoadingNotas(false);
      }
    },
    [toast]
  );

  const elegir = (p: AdminUser) => {
    setPaciente(p);
    setLoadingNotas(true);
    cargarNotas(p.clienteId!);
  };

  const citas = useMemo(
    () =>
      paciente
        ? c.reservas.filter((r) => r.clienteId === paciente.clienteId).sort((a, b) => b.fechaHoraInicio.localeCompare(a.fechaHoraInicio))
        : [],
    [c.reservas, paciente]
  );

  const resumen = useMemo(() => {
    const atendidas = citas.filter((r) => r.estado === 'ATENDIDA');
    const proxima = [...citas]
      .filter((r) => r.estado === 'PROGRAMADA' && diaDe(r) >= hoy)
      .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))[0];
    return {
      sesiones: atendidas.length,
      invertido: atendidas.reduce((a, r) => a + Number(r.precioTotal), 0),
      ultima: atendidas[0]?.fechaHoraInicio,
      proxima,
      dolorActual: notas.find((n) => n.nivelDolor !== null)?.nivelDolor ?? null,
      dolorInicial: [...notas].reverse().find((n) => n.nivelDolor !== null)?.nivelDolor ?? null,
    };
  }, [citas, notas, hoy]);

  // Historia clínica completa del paciente: notas de evolución + citas
  const reporte = (p: AdminUser): Reporte => ({
    titulo: `Historia clínica · ${p.nombreCompleto}`,
    subtitulo: `${p.email} · Historia #${p.clienteId}`,
    columnas: ['Fecha', 'Registro', 'Detalle', 'Dolor (EVA)', 'Fisioterapeuta', 'Plan / Estado'],
    filas: [
      ...notas.map((n) => [
        n.fecha.slice(0, 16).replace('T', ' '),
        'Nota de evolución',
        `${n.motivo}${n.evolucion ? ` — ${n.evolucion}` : ''}`,
        n.nivelDolor !== null ? `${n.nivelDolor}/10` : '—',
        n.fisioterapeutaId ? c.fisio[n.fisioterapeutaId]?.nombre ?? '—' : '—',
        n.plan ?? '—',
      ]),
      ...citas.map((r) => [
        r.fechaHoraInicio.slice(0, 16).replace('T', ' '),
        'Cita',
        nombresServicios(r),
        '—',
        r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId]?.nombre ?? '—' : '—',
        estadoMeta[r.estado]?.label ?? r.estado,
      ]),
    ].sort((a, b) => String(b[0]).localeCompare(String(a[0]))),
    resumen: [
      ['Sesiones completadas', String(resumen.sesiones)],
      ['Dolor actual', resumen.dolorActual !== null ? `${resumen.dolorActual}/10` : '—'],
      ['Total invertido', formatCurrency(resumen.invertido)],
    ],
    archivo: nombreArchivo(`historia-${p.nombreCompleto}`),
  });

  return (
    <>
      <PageHeader title="Historial clínico" description="Busca un paciente para ver sus sesiones y notas de evolución." />

      {c.error !== null && <ErrorBanner service="Micro-Reservas" message={c.error} onRetry={c.refresh} />}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Lista de pacientes */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar paciente" className="sm:max-w-none" />
          <ul className="mt-3 max-h-72 space-y-0.5 overflow-y-auto lg:max-h-none">
            {c.loading
              ? [0, 1, 2, 3].map((i) => <li key={i} className="h-12 animate-pulse rounded-xl bg-slate-800/40" />)
              : pacientes.length === 0
                ? <li className="p-4 text-center text-xs text-slate-500">Sin pacientes</li>
                : pacientes.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => elegir(p)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                          paciente?.id === p.id ? 'bg-teal-500/10 ring-1 ring-teal-500/30' : 'hover:bg-slate-800/50'
                        )}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                          {iniciales(p.nombreCompleto)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white">{p.nombreCompleto}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {c.reservas.filter((r) => r.clienteId === p.clienteId).length} citas
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
          </ul>
        </section>

        {/* Ficha */}
        {!paciente ? (
          <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <EmptyState icon={ClipboardList} title="Selecciona un paciente" description="Verás su resumen clínico, sus citas y las notas de evolución." />
          </section>
        ) : (
          <div className="min-w-0 space-y-4">
            <section className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-900/40 p-5 sm:flex-row sm:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-bold text-white">
                {iniciales(paciente.nombreCompleto)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-white">{paciente.nombreCompleto}</h2>
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                  {paciente.email}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Paciente desde {paciente.fechaCreacion ? formatDate(paciente.fechaCreacion) : '—'} · Historia #{paciente.clienteId}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ExportButtons
                  disabled={loadingNotas}
                  onPDF={() => exportarPDF(reporte(paciente))}
                  onExcel={() => exportarExcel(reporte(paciente), 'Historial')}
                />
                <Button size="sm" onClick={() => setModal(true)} className="gap-2">
                  <FilePlus2 className="h-4 w-4" />
                  Nueva nota
                </Button>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Mini icon={CalendarDays} label="Sesiones completadas" value={resumen.sesiones} />
              <Mini icon={Wallet} label="Total invertido" value={formatCurrency(resumen.invertido)} />
              <Mini
                icon={HeartPulse}
                label="Dolor (EVA)"
                value={resumen.dolorActual !== null ? `${resumen.dolorActual}/10` : '—'}
                hint={
                  resumen.dolorInicial !== null && resumen.dolorActual !== null && notas.length > 1
                    ? `Inició en ${resumen.dolorInicial}/10`
                    : undefined
                }
              />
              <Mini
                icon={CalendarDays}
                label="Próxima cita"
                value={resumen.proxima ? formatDateTime(resumen.proxima.fechaHoraInicio) : 'Sin agendar'}
                small
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              <Panel title="Notas de evolución" description={`${notas.length} registros`} className="xl:col-span-3">
                {loadingNotas ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/40" />
                    ))}
                  </div>
                ) : notas.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="Sin notas todavía" description="Registra la primera evaluación con “Nueva nota”." />
                ) : (
                  <ol className="relative space-y-5 border-l border-slate-800 pl-5">
                    {notas.map((n) => (
                      <li key={n.id} className="relative">
                        <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-slate-900 bg-teal-400" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{n.motivo}</p>
                          <span className="text-xs text-slate-500">{formatDateTime(n.fecha)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {n.fisioterapeutaId ? c.fisio[n.fisioterapeutaId]?.nombre : 'Profesional no indicado'}
                          {n.reservaId ? ` · Cita #${n.reservaId}` : ''}
                        </p>
                        {n.nivelDolor !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
                              <div className="h-full rounded-full" style={{ width: `${n.nivelDolor * 10}%`, background: colorDolor(n.nivelDolor) }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: colorDolor(n.nivelDolor) }}>
                              Dolor {n.nivelDolor}/10
                            </span>
                          </div>
                        )}
                        {n.evolucion && <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{n.evolucion}</p>}
                        {n.plan && (
                          <p className="mt-2 rounded-lg bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                            <span className="font-semibold text-teal-400">Plan: </span>
                            {n.plan}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>

              <Panel title="Citas" description={`${citas.length} en total`} className="xl:col-span-2">
                {citas.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="Sin citas registradas" />
                ) : (
                  <ul className="-my-2 divide-y divide-slate-800/70">
                    {citas.map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200">{formatDateTime(r.fechaHoraInicio)}</p>
                          <p className="truncate text-xs text-slate-500">{nombresServicios(r)}</p>
                        </div>
                        <EstadoBadge estado={r.estado} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        )}
      </div>

      {paciente && (
        <NuevaNotaModal
          open={modal}
          onClose={() => setModal(false)}
          clienteId={paciente.clienteId!}
          citas={citas.filter((r) => r.estado !== 'CANCELADA')}
          fisios={c.fisios.filter((f) => f.activo)}
          onSaved={(n) => setNotas((prev) => [n, ...prev])}
        />
      )}
    </>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  hint,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5 text-teal-400" />
        {label}
      </p>
      <p className={cn('mt-1.5 font-bold text-white', small ? 'text-sm' : 'text-xl tabular-nums')}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function NuevaNotaModal({
  open,
  onClose,
  clienteId,
  citas,
  fisios,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  clienteId: number;
  citas: ReturnType<typeof useClinica>['reservas'];
  fisios: ReturnType<typeof useClinica>['fisios'];
  onSaved: (n: NotaClinica) => void;
}) {
  const toast = useToast();
  const [reservaId, setReservaId] = useState('');
  const [fisioId, setFisioId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [evolucion, setEvolucion] = useState('');
  const [dolor, setDolor] = useState(5);
  const [plan, setPlan] = useState('');
  const [saving, setSaving] = useState(false);

  // Al elegir la cita se propone su fisioterapeuta
  const elegirCita = (id: string) => {
    setReservaId(id);
    const r = citas.find((x) => String(x.id) === id);
    if (r?.fisioterapeutaId) setFisioId(String(r.fisioterapeutaId));
  };

  const submit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    setSaving(true);
    try {
      const res = await bookingService.addNote({
        clienteId,
        reservaId: reservaId ? Number(reservaId) : null,
        fisioterapeutaId: fisioId ? Number(fisioId) : null,
        motivo: motivo.trim(),
        evolucion: evolucion.trim() || null,
        nivelDolor: dolor,
        plan: plan.trim() || null,
      });
      onSaved(res.data);
      toast.success('Nota de evolución registrada');
      setMotivo('');
      setEvolucion('');
      setPlan('');
      setReservaId('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva nota de evolución" description="Queda registrada en el historial del paciente." icon={FilePlus2}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cita relacionada">
            <select value={reservaId} onChange={(e) => elegirCita(e.target.value)} className={fieldClass}>
              <option value="">Ninguna</option>
              {citas.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} · {r.fechaHoraInicio.slice(0, 10)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fisioterapeuta">
            <select value={fisioId} onChange={(e) => setFisioId(e.target.value)} className={fieldClass}>
              <option value="">Sin indicar</option>
              {fisios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Motivo / diagnóstico">
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} required maxLength={200} className={fieldClass} placeholder="Ej. Lumbalgia mecánica – sesión 3" />
        </Field>
        <Field label={`Nivel de dolor (EVA): ${dolor}/10`}>
          <input type="range" min={0} max={10} value={dolor} onChange={(e) => setDolor(Number(e.target.value))} className="w-full accent-teal-500" />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Sin dolor</span>
            <span>Moderado</span>
            <span>Máximo</span>
          </div>
        </Field>
        <Field label="Evolución">
          <textarea value={evolucion} onChange={(e) => setEvolucion(e.target.value)} rows={3} maxLength={2000} className={fieldClass} placeholder="Hallazgos, respuesta al tratamiento, rango de movimiento…" />
        </Field>
        <Field label="Plan">
          <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={2} maxLength={1000} className={fieldClass} placeholder="Ejercicios en casa, próxima sesión…" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={saving}>
            Guardar nota
          </Button>
        </div>
      </form>
    </Modal>
  );
}
