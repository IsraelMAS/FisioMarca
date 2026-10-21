'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  ShoppingCart,
  Timer,
} from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { useAuth } from '@/lib/auth/context';
import { addDays, parseISODate, toLocalISODate } from '@/lib/admin';
import { useHoy } from '@/lib/use-clinica';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCart, MAX_SESIONES } from '@/components/cart/cart-context';
import { PasosCompra } from '@/components/cart/pasos-compra';
import { useToast } from '@/components/admin/toast';
import type { SlotDisponibilidad } from '@/types';

const DIAS_ANTICIPACION = 30;
const DIAS_VISIBLES = 14;

interface Sesion {
  key: string;
  servicioId: number;
  nombre: string;
  numero: number;
  de: number;
  duracion: number;
  precio: number;
  imagenUrl: string | null;
}

type Eleccion = Record<string, { fecha: string; hora: string }>;

export default function AgendarYPagarPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { items, total, listo } = useCart();
  const hoy = useHoy();
  const [eleccion, setEleccion] = useState<Eleccion>({});
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada unidad del carrito es una sesión con su propio día y hora
  const sesiones = useMemo<Sesion[]>(
    () =>
      items.flatMap((it) =>
        Array.from({ length: it.cantidad }, (_, i) => ({
          key: `${it.servicioId}-${i}`,
          servicioId: it.servicioId,
          nombre: it.servicioNombre,
          numero: i + 1,
          de: it.cantidad,
          duracion: it.duracionMinutos ?? 45,
          precio: Number(it.precioUnitario),
          imagenUrl: it.imagenUrl,
        }))
      ),
    [items]
  );

  const completas = sesiones.filter((s) => eleccion[s.key]?.fecha && eleccion[s.key]?.hora).length;
  const listoParaPagar = sesiones.length > 0 && completas === sesiones.length;

  const elegir = (key: string, cambio: Partial<{ fecha: string; hora: string }>) =>
    setEleccion((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { fecha: '', hora: '' }), ...cambio } }));

  const continuar = async () => {
    if (!user?.clienteId || !listoParaPagar) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await bookingService.checkout({
        clienteId: user.clienteId,
        notas: notas.trim() || undefined,
        sesiones: sesiones.map((s) => ({
          servicioId: s.servicioId,
          fechaHoraInicio: `${eleccion[s.key].fecha}T${eleccion[s.key].hora}:00`,
        })),
      });
      toast.success('Horarios apartados. Tienes 10 minutos para pagar.');
      router.push(`/reservas/pago/${res.data.codigo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron apartar los horarios');
      setEnviando(false);
    }
  };

  if (!listo || !hoy) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> Preparando tu reserva…
      </div>
    );
  }

  if (sesiones.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 ring-1 ring-slate-800">
          <ShoppingCart className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold text-white">Primero elige tus tratamientos</h1>
        <p className="mt-2 text-sm text-slate-400">
          Añade al carrito las sesiones que necesitas (máximo {MAX_SESIONES}) y vuelve aquí para elegir los horarios y pagar.
        </p>
        <Link
          href="/servicios"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25"
        >
          Ver tratamientos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/carrito" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Volver al carrito
      </Link>

      <PasosCompra actual={2} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Elige el día y la hora de cada sesión</h1>
        <p className="mt-2 text-sm text-slate-400">
          Atendemos de lunes a sábado, de 07:00 a 12:00 y de 14:00 a 19:00. Solo ves horarios con fisioterapeuta y sala libres.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Sesiones */}
        <div className="min-w-0 space-y-4">
          {sesiones.map((s, i) => (
            <SesionCard
              key={s.key}
              indice={i + 1}
              sesion={s}
              valor={eleccion[s.key]}
              hoy={hoy}
              fechasOcupadas={sesiones.filter((o) => o.key !== s.key).map((o) => eleccion[o.key]?.fecha).filter(Boolean) as string[]}
              onFecha={(fecha) => elegir(s.key, { fecha, hora: '' })}
              onHora={(hora) => elegir(s.key, { hora })}
            />
          ))}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <label htmlFor="notas" className="text-sm font-medium text-slate-200">
              Cuéntanos tu molestia <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej. Dolor lumbar al estar sentado, desde hace 2 semanas."
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Resumen */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-slate-800 px-5 py-4">
              <p className="font-semibold text-white">Resumen de tu compra</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {completas} de {sesiones.length} sesiones con horario
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                  animate={{ width: `${(completas / sesiones.length) * 100}%` }}
                />
              </div>
            </div>
            <ul className="divide-y divide-slate-800/70 px-5">
              {sesiones.map((s, i) => {
                const v = eleccion[s.key];
                return (
                  <li key={s.key} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-slate-200">
                        {i + 1}. {s.nombre}
                      </p>
                      <p className={cn('text-xs', v?.hora ? 'text-teal-300' : 'text-slate-500')}>
                        {v?.fecha && v?.hora
                          ? `${parseISODate(v.fecha).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })} · ${v.hora}`
                          : 'Sin horario'}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums text-slate-300">{formatCurrency(s.precio)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-4 border-t border-slate-800 bg-slate-950/40 px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-400">Total a pagar</span>
                <span className="text-2xl font-bold tabular-nums text-white">{formatCurrency(total)}</span>
              </div>
              {error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</p>}
              <button
                onClick={continuar}
                disabled={!listoParaPagar || enviando}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {enviando ? 'Apartando horarios…' : 'Continuar al pago'}
              </button>
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
                <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                Al continuar apartamos tus horarios por 10 minutos. Si no completas el pago, se liberan para otros pacientes.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Info className="h-3.5 w-3.5" /> Reglas de reserva
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" /> Hasta {MAX_SESIONES} sesiones por compra.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" /> Una sesión por día, para que tu cuerpo se recupere.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" /> Máximo 4 citas activas por paciente.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" /> Reservas con hasta {DIAS_ANTICIPACION} días de anticipación.</li>
              <li className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-500" /> La cita se confirma solo al pagar.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Tarjeta de una sesión: día + horario ────────────────────────────
function SesionCard({
  indice,
  sesion,
  valor,
  hoy,
  fechasOcupadas,
  onFecha,
  onHora,
}: {
  indice: number;
  sesion: Sesion;
  valor?: { fecha: string; hora: string };
  hoy: string;
  fechasOcupadas: string[];
  onFecha: (f: string) => void;
  onHora: (h: string) => void;
}) {
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargando, setCargando] = useState(false);
  const fecha = valor?.fecha ?? '';

  const dias = useMemo(() => {
    const base = parseISODate(hoy);
    const lista: { iso: string; dow: string; dia: number; mes: string }[] = [];
    for (let i = 0; lista.length < DIAS_VISIBLES && i <= DIAS_ANTICIPACION; i++) {
      const d = addDays(base, i);
      if (d.getDay() === 0) continue; // domingo cerrado
      lista.push({
        iso: toLocalISODate(d),
        dow: d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
        dia: d.getDate(),
        mes: d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', ''),
      });
    }
    return lista;
  }, [hoy]);

  useEffect(() => {
    if (!fecha) return;
    let cancel = false;
    bookingService
      .checkAvailability(fecha, [sesion.servicioId])
      .then((res) => !cancel && setSlots(res.data?.horarios ?? []))
      .catch(() => !cancel && setSlots([]))
      .finally(() => !cancel && setCargando(false));
    return () => {
      cancel = true;
    };
  }, [fecha, sesion.servicioId]);

  const cambiarFecha = (iso: string) => {
    setCargando(true);
    onFecha(iso);
  };

  const max = toLocalISODate(addDays(parseISODate(hoy), DIAS_ANTICIPACION));
  const fueraDeLista = fecha && !dias.some((d) => d.iso === fecha);
  const repetida = fecha && fechasOcupadas.includes(fecha);
  const domingo = fecha && parseISODate(fecha).getDay() === 0;
  const libres = slots.filter((s) => s.disponible).length;
  const completa = !!(valor?.fecha && valor?.hora);

  return (
    <section
      className={cn(
        'rounded-2xl border bg-slate-900/50 p-5 transition-colors',
        completa ? 'border-teal-500/30' : 'border-slate-800'
      )}
    >
      <header className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-800">
          {sesion.imagenUrl ? (
            <Image src={sesion.imagenUrl} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <Activity className="m-auto h-full w-6 text-slate-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
            Sesión {indice}
            {sesion.de > 1 && <span className="text-slate-500"> · {sesion.numero} de {sesion.de}</span>}
          </p>
          <p className="truncate font-semibold text-white">{sesion.nombre}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" /> {formatDuration(sesion.duracion)} · {formatCurrency(sesion.precio)}
          </p>
        </div>
        {completa && <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-400" />}
      </header>

      {/* Días */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <CalendarDays className="h-3.5 w-3.5 text-teal-400" /> Día
          </p>
          <label className="flex items-center gap-2 text-[11px] text-slate-500">
            Otra fecha
            <input
              type="date"
              min={hoy}
              max={max}
              value={fueraDeLista ? fecha : ''}
              onChange={(e) => e.target.value && cambiarFecha(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200"
            />
          </label>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {dias.map((d) => {
            const ocupado = fechasOcupadas.includes(d.iso);
            const activo = fecha === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => cambiarFecha(d.iso)}
                disabled={ocupado}
                title={ocupado ? 'Ya tienes otra sesión ese día' : undefined}
                className={cn(
                  'flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 transition-all',
                  activo
                    ? 'border-teal-400 bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                    : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-teal-500/50',
                  ocupado && 'cursor-not-allowed opacity-30 line-through'
                )}
              >
                <span className="text-[10px] font-medium uppercase">{d.dow}</span>
                <span className="text-lg font-bold leading-tight tabular-nums">{d.dia}</span>
                <span className="text-[10px] uppercase opacity-80">{d.mes}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Horarios */}
      {fecha && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <Clock className="h-3.5 w-3.5 text-teal-400" /> Hora
            {!cargando && !repetida && !domingo && <span className="font-normal text-slate-500">· {libres} disponibles</span>}
          </p>
          {repetida ? (
            <Aviso texto="Ya elegiste otra sesión ese día. Elige un día distinto: una sesión por día." />
          ) : domingo ? (
            <Aviso texto="Los domingos la clínica no atiende." />
          ) : cargando ? (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : libres === 0 ? (
            <Aviso texto="No quedan horarios libres ese día. Prueba con otra fecha." />
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s.hora}
                  type="button"
                  disabled={!s.disponible}
                  onClick={() => onHora(s.hora)}
                  title={s.motivo ?? undefined}
                  className={cn(
                    'h-9 rounded-lg border text-xs font-semibold tabular-nums transition-all',
                    valor?.hora === s.hora
                      ? 'border-teal-400 bg-teal-500 text-slate-950'
                      : s.disponible
                        ? 'border-slate-800 bg-slate-950/50 text-slate-200 hover:border-teal-500/60'
                        : 'cursor-not-allowed border-transparent text-slate-700 line-through'
                  )}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Aviso({ texto }: { texto: string }) {
  return <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">{texto}</p>;
}
