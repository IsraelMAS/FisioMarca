'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarCheck2, ClipboardList, HeartPulse, Sparkles, TrendingDown } from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Fisioterapeuta, NotaClinica, Reserva } from '@/types';

function colorDolor(n: number) {
  if (n <= 3) return '#34d399';
  if (n <= 6) return '#fbbf24';
  return '#fb7185';
}

// Resumen clínico del paciente: dolor (EVA) sesión a sesión e indicaciones
export function MiEvolucion({ clienteId }: { clienteId: number }) {
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [citas, setCitas] = useState<Reserva[]>([]);
  const [fisios, setFisios] = useState<Record<number, Fisioterapeuta>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    Promise.allSettled([
      bookingService.getHistory(clienteId),
      bookingService.getByClient(clienteId),
      bookingService.listTherapists(),
    ]).then(([n, c, f]) => {
      if (cancel) return;
      if (n.status === 'fulfilled') setNotas(n.value.data ?? []);
      if (c.status === 'fulfilled') setCitas(c.value.data ?? []);
      if (f.status === 'fulfilled') {
        const map: Record<number, Fisioterapeuta> = {};
        (f.value.data ?? []).forEach((x) => (map[x.id] = x));
        setFisios(map);
      }
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [clienteId]);

  const datos = useMemo(() => {
    const cronologico = [...notas].filter((n) => n.nivelDolor !== null).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const serie = cronologico.map((n, i) => ({
      label: `S${i + 1}`,
      fecha: formatDate(n.fecha),
      dolor: n.nivelDolor as number,
    }));
    const inicial = serie[0]?.dolor ?? null;
    const actual = serie[serie.length - 1]?.dolor ?? null;
    const completadas = citas.filter((c) => c.estado === 'ATENDIDA').length;
    const ultima = [...notas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    return { serie, inicial, actual, completadas, ultima };
  }, [notas, citas]);

  if (loading) return <div className="h-72 animate-pulse rounded-2xl bg-slate-900/60" />;

  const mejora = datos.inicial !== null && datos.actual !== null ? datos.inicial - datos.actual : 0;
  const pctMejora = datos.inicial ? Math.round((mejora / datos.inicial) * 100) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">Mi evolución</h2>
          <p className="text-xs text-slate-400">Así va tu recuperación según las notas de tu fisioterapeuta.</p>
        </div>
      </div>

      {datos.serie.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-300">Aún no hay evaluaciones registradas.</p>
          <p className="mt-1 text-xs text-slate-500">Después de tu primera sesión verás aquí tu progreso.</p>
          <Link href="/reservas/nueva" className="mt-4 inline-block text-sm font-medium text-teal-400 hover:text-teal-300">
            Agendar una cita →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Dato icon={CalendarCheck2} label="Sesiones" valor={String(datos.completadas)} />
            <Dato
              icon={HeartPulse}
              label="Dolor actual"
              valor={`${datos.actual}/10`}
              color={datos.actual !== null ? colorDolor(datos.actual) : undefined}
            />
            <Dato
              icon={TrendingDown}
              label="Mejora"
              valor={mejora > 0 ? `${pctMejora}%` : '—'}
              color={mejora > 0 ? '#34d399' : undefined}
            />
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datos.serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDolor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-slate-800)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--color-slate-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: 'var(--color-slate-500)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-slate-900)', border: '1px solid var(--color-slate-800)', borderRadius: 12, fontSize: 12 }}
                  labelFormatter={(_, p) => p?.[0]?.payload?.fecha ?? ''}
                  formatter={(v) => [`${v}/10`, 'Dolor']}
                />
                <Area type="monotone" dataKey="dolor" stroke="#2dd4bf" strokeWidth={2.5} fill="url(#gradDolor)" dot={{ r: 4, fill: '#2dd4bf' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">Escala EVA: 0 = sin dolor · 10 = dolor máximo</p>

          {datos.ultima?.plan && (
            <div className="mt-6 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
                <Sparkles className="h-3.5 w-3.5" /> Indicaciones de tu fisioterapeuta
              </p>
              <p className="mt-2 text-sm text-slate-200">{datos.ultima.plan}</p>
              <p className="mt-2 text-xs text-slate-500">
                {datos.ultima.fisioterapeutaId ? fisios[datos.ultima.fisioterapeutaId]?.nombre : 'Tu fisioterapeuta'} ·{' '}
                {formatDateTime(datos.ultima.fecha)}
              </p>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

function Dato({
  icon: Icon,
  label,
  valor,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  valor: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950/60 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-slate-500" />
      <p className="text-xl font-bold tabular-nums text-white" style={color ? { color } : undefined}>
        {valor}
      </p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
