'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, CalendarCheck2, CalendarClock, RefreshCw, Users, Wallet, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { bookingService } from '@/lib/api/booking.service';
import { formatCurrency } from '@/lib/format';
import {
  addDays,
  diaDe,
  horaDe,
  inicioSemana,
  nombresServicios,
  parseISODate,
  rangoFechas,
  rangos,
  toLocalISODate,
  type Rango,
} from '@/lib/admin';
import { useClinica, useHoy } from '@/lib/use-clinica';
import {
  EmptyState,
  ErrorBanner,
  EstadoBadge,
  FisioTag,
  PageHeader,
  Panel,
  Segmented,
  SkeletonRows,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import type { DashboardData, Reserva } from '@/types';

const PALETA = ['#2dd4bf', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MINUTOS_JORNADA = 600; // 07:00–12:00 y 14:00–19:00

const tooltipStyle = {
  contentStyle: {
    background: 'var(--color-slate-900)',
    border: '1px solid var(--color-slate-800)',
    borderRadius: 12,
    fontSize: 12,
    color: 'var(--color-slate-200)',
  },
  itemStyle: { color: 'var(--color-slate-200)' },
  labelStyle: { color: 'var(--color-slate-400)', marginBottom: 4 },
};

// Una retención de pago aún no es una cita: no cuenta en las métricas
const activa = (r: Reserva) => r.estado !== 'CANCELADA' && r.estado !== 'PENDIENTE_PAGO';

export default function DashboardPage() {
  const { user } = useAuth();
  const c = useClinica();
  const hoy = useHoy();
  const [rango, setRango] = useState<Rango>('mes');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDash = useCallback(async () => {
    const { desde, hasta } = rangoFechas(rango);
    try {
      const res = await bookingService.getDashboard(toLocalISODate(desde), toLocalISODate(hasta));
      setData(res.data);
      setError(null);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : '');
    } finally {
      setLoadingDash(false);
    }
  }, [rango]);

  useEffect(() => {
    loadDash();
  }, [loadDash]);

  const refresh = () => {
    setLoadingDash(true);
    loadDash();
    c.refresh();
  };

  const loading = loadingDash || c.loading || !hoy;

  // ─── Métricas derivadas del listado completo ──────────────────────
  const derivados = useMemo(() => {
    if (!hoy) return null;
    const lunes = inicioSemana(parseISODate(hoy));
    const mes = hoy.slice(0, 7);

    const semanas = Array.from({ length: 10 }, (_, i) => {
      const ini = addDays(lunes, -7 * (9 - i));
      const a = toLocalISODate(ini);
      const b = toLocalISODate(addDays(ini, 7));
      const delPeriodo = c.reservas.filter((r) => diaDe(r) >= a && diaDe(r) < b);
      return {
        label: `${ini.getDate()} ${MESES[ini.getMonth()]}`,
        Agendadas: delPeriodo.filter(activa).length,
        Completadas: delPeriodo.filter((r) => r.estado === 'ATENDIDA').length,
        Canceladas: delPeriodo.filter((r) => r.estado === 'CANCELADA').length,
      };
    });

    let cobrado = 0;
    let porCobrar = 0;
    for (const r of c.reservas) {
      if (!diaDe(r).startsWith(mes)) continue;
      if (r.estado === 'ATENDIDA') cobrado += Number(r.precioTotal);
      else if (r.estado !== 'CANCELADA') porCobrar += Number(r.precioTotal);
    }

    const porDia: Record<string, number> = {};
    c.reservas.filter(activa).forEach((r) => (porDia[diaDe(r)] = (porDia[diaDe(r)] ?? 0) + 1));
    const inicioHeat = addDays(lunes, -7 * 52);
    const heat = Array.from({ length: 53 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const f = addDays(inicioHeat, w * 7 + d);
        const iso = toLocalISODate(f);
        return { iso, n: porDia[iso] ?? 0, futuro: iso > hoy, dia: f.getDate(), mes: f.getMonth() };
      })
    );

    const deHoy = c.reservas.filter((r) => diaDe(r) === hoy && activa(r));
    const ocupacion = c.fisios
      .filter((f) => f.activo)
      .map((f) => {
        const suyas = deHoy.filter((r) => r.fisioterapeutaId === f.id);
        const minutos = suyas.reduce(
          (a, r) => a + (new Date(r.fechaHoraFin).getTime() - new Date(r.fechaHoraInicio).getTime()) / 60000,
          0
        );
        return { fisio: f, citas: suyas.length, pct: Math.min(100, Math.round((minutos / MINUTOS_JORNADA) * 100)) };
      });

    const proximas = c.reservas
      .filter((r) => (r.estado === 'PROGRAMADA' || r.estado === 'EN_ATENCION') && diaDe(r) >= hoy)
      .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
      .slice(0, 8);

    return { semanas, cobrado, porCobrar, heat, ocupacion, proximas, totalAnual: Object.values(porDia).reduce((a, n) => a + n, 0) };
  }, [c.reservas, c.fisios, hoy]);

  const tratamientos = (data?.topServicios ?? []).map((t, i) => ({ name: t.label, value: t.value, fill: PALETA[i % PALETA.length] }));
  const rangoLabel = rangos.find((r) => r.value === rango)?.label.toLowerCase();

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.nombre?.split(' ')[0] ?? 'Admin'}`}
        description="Resumen de la actividad clínica de FisioMarca."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} aria-label="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      <div className="mb-6">
        <Segmented
          value={rango}
          onChange={(r) => {
            setLoadingDash(true);
            setRango(r);
          }}
          options={rangos}
        />
      </div>

      {error !== null && !loadingDash && <ErrorBanner service="Micro-Reservas" message={error || undefined} onRetry={refresh} />}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Pacientes activos"
          value={data?.pacientesActivos ?? '—'}
          hint="Con citas en los últimos 90 días"
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Citas de hoy"
          value={data?.citasHoy ?? '—'}
          hint={data ? `${data.enAtencion} en atención ahora` : undefined}
          icon={CalendarCheck2}
          tone="sky"
          loading={loading}
        />
        <StatCard
          label="Ingresos del mes"
          value={derivados?.cobrado ?? 0}
          format={formatCurrency}
          hint={`${formatCurrency(derivados?.porCobrar ?? 0)} por cobrar`}
          icon={Wallet}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          label="Tasa de cancelación"
          value={data ? data.tasaCancelacion : '—'}
          format={(n) => `${n.toFixed(1)}%`}
          hint={data ? `${data.canceladas} de ${data.totalReservas} · ${rangoLabel}` : undefined}
          icon={XCircle}
          tone="rose"
          loading={loading}
        />
      </div>

      {/* Gráficos */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Evolución de citas semanales" description="Últimas 10 semanas" className="lg:col-span-2">
          {derivados && !loading ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={derivados.semanas} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-slate-800)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--color-slate-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--color-slate-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--color-slate-400)' }} />
                  <Line type="monotone" dataKey="Agendadas" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Completadas" stroke="#34d399" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  <Line type="monotone" dataKey="Canceladas" stroke="#fb7185" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 animate-pulse rounded-xl bg-slate-800/40" />
          )}
        </Panel>

        <Panel title="Tratamientos más solicitados" description={`Top 5 · ${rangoLabel}`}>
          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-800/40" />
          ) : tratamientos.length > 0 ? (
            <>
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tratamientos} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3} stroke="none" />
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{tratamientos.reduce((a, t) => a + t.value, 0)}</span>
                  <span className="text-[11px] text-slate-500">sesiones</span>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {tratamientos.map((t) => (
                  <li key={t.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-slate-400">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.fill }} />
                      <span className="truncate">{t.name}</span>
                    </span>
                    <span className="font-medium tabular-nums text-white">{t.value}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState title="Sin sesiones en este periodo" description="Prueba con un rango más amplio." />
          )}
        </Panel>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Actividad del último año"
          description={derivados ? `${derivados.totalAnual} citas registradas` : undefined}
          className="lg:col-span-2"
        >
          {derivados && !loading ? <Heatmap semanas={derivados.heat} /> : <div className="h-32 animate-pulse rounded-xl bg-slate-800/40" />}
        </Panel>

        <Panel title="Ocupación de hoy" description="Carga de cada fisioterapeuta">
          {loading || !derivados ? (
            <div className="h-32 animate-pulse rounded-xl bg-slate-800/40" />
          ) : derivados.ocupacion.length === 0 ? (
            <EmptyState title="Sin fisioterapeutas activos" />
          ) : (
            <ul className="space-y-4">
              {derivados.ocupacion.map(({ fisio, citas, pct }) => (
                <li key={fisio.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-slate-300">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fisio.color }} />
                      <span className="truncate">{fisio.nombre}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {citas} {citas === 1 ? 'cita' : 'citas'} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: fisio.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Próximas citas */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Próximas citas</h2>
        <Link href="/dashboard/reservas" className="flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Paciente</Th>
            <Th>Fisioterapeuta</Th>
            <Th>Hora</Th>
            <Th>Tratamiento</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {loading ? (
            <SkeletonRows cols={5} rows={4} />
          ) : !derivados || derivados.proximas.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={CalendarClock} title="No hay citas pendientes" description="Las nuevas reservas aparecerán aquí." />
              </td>
            </tr>
          ) : (
            derivados.proximas.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-800/20">
                <Td className="font-medium text-white">{c.nombrePaciente(r.clienteId)}</Td>
                <Td>
                  <FisioTag fisio={r.fisioterapeutaId ? c.fisio[r.fisioterapeutaId] : null} />
                </Td>
                <Td className="whitespace-nowrap">
                  <span className="font-semibold tabular-nums text-slate-200">{horaDe(r.fechaHoraInicio)}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {diaDe(r) === hoy ? 'Hoy' : parseISODate(diaDe(r)).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  </span>
                </Td>
                <Td className="max-w-[240px] truncate text-slate-400">{nombresServicios(r)}</Td>
                <Td>
                  <EstadoBadge estado={r.estado} />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
}

// ─── Heatmap tipo calendario ─────────────────────────────────────────

function nivel(n: number) {
  if (n === 0) return 'bg-slate-800/60';
  if (n === 1) return 'bg-teal-900';
  if (n === 2) return 'bg-teal-700';
  if (n <= 4) return 'bg-teal-500';
  return 'bg-teal-300';
}

function Heatmap({ semanas }: { semanas: { iso: string; n: number; futuro: boolean; dia: number; mes: number }[][] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex gap-2">
        <div className="mt-5 grid grid-rows-7 gap-[3px] text-[10px] text-slate-500">
          {['Lun', '', 'Mié', '', 'Vie', '', ''].map((d, i) => (
            <span key={i} className="h-[11px] leading-[11px]">
              {d}
            </span>
          ))}
        </div>
        <div>
          <div className="mb-1 flex gap-[3px] text-[10px] text-slate-500">
            {semanas.map((sem, i) => (
              <span key={i} className="w-[11px] overflow-visible whitespace-nowrap">
                {sem[0].dia <= 7 ? MESES[sem[0].mes] : ''}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {semanas.map((sem, i) => (
              <div key={i} className="grid grid-rows-7 gap-[3px]">
                {sem.map((d) => (
                  <span
                    key={d.iso}
                    title={`${d.iso}: ${d.n} ${d.n === 1 ? 'cita' : 'citas'}`}
                    className={`h-[11px] w-[11px] rounded-[3px] ${d.futuro ? 'bg-transparent' : nivel(d.n)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
            Menos
            {[0, 1, 2, 3, 5].map((n) => (
              <span key={n} className={`h-[11px] w-[11px] rounded-[3px] ${nivel(n)}`} />
            ))}
            Más
          </div>
        </div>
      </div>
    </div>
  );
}
