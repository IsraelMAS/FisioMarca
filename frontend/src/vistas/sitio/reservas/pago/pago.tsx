'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FlaskConical,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Timer,
  XCircle,
} from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { METODO_LABEL, horaDe, parseISODate } from '@/lib/admin';
import { comprobantePDF, exportarExcel } from '@/lib/export';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/cart-context';
import { PasosCompra } from '@/components/cart/pasos-compra';
import { useToast } from '@/components/admin/toast';
import { ExportButtons } from '@/components/ui/export-buttons';
import type { Fisioterapeuta, MetodoPago, Orden, Sala } from '@/types';

// ─── Utilidades de tarjeta ───────────────────────────────────────────
const soloDigitos = (s: string) => s.replace(/\D/g, '');

function marcaDe(numero: string): 'Visa' | 'Mastercard' | 'Amex' | null {
  if (/^4/.test(numero)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(numero)) return 'Mastercard';
  if (/^3[47]/.test(numero)) return 'Amex';
  return null;
}

function luhn(numero: string) {
  let suma = 0;
  let doble = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = Number(numero[i]);
    if (doble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    doble = !doble;
  }
  return numero.length >= 13 && suma % 10 === 0;
}

const DATOS_PRUEBA = [
  { metodo: 'TARJETA' as const, titulo: 'Visa aprobada', detalle: '4242 4242 4242 4242 · 12/30 · 123', numero: '4242424242424242', venc: '12/30', cvv: '123' },
  { metodo: 'TARJETA' as const, titulo: 'Mastercard aprobada', detalle: '5555 5555 5555 4444 · 08/29 · 321', numero: '5555555555554444', venc: '08/29', cvv: '321' },
  { metodo: 'TARJETA' as const, titulo: 'Tarjeta rechazada', detalle: '4000 0000 0000 0002 · 12/30 · 123', numero: '4000000000000002', venc: '12/30', cvv: '123' },
  { metodo: 'YAPE' as const, titulo: 'Yape / Plin aprobado', detalle: 'Celular 987654321 · código 123456', telefono: '987654321', codigo: '123456' },
  { metodo: 'YAPE' as const, titulo: 'Yape / Plin rechazado', detalle: 'Celular 987654321 · código 000000', telefono: '987654321', codigo: '000000' },
];

export default function PagoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user, profile } = useAuth();
  const { vaciar } = useCart();
  const [orden, setOrden] = useState<Orden | null>(null);
  const [fisios, setFisios] = useState<Record<number, Fisioterapeuta>>({});
  const [salas, setSalas] = useState<Record<number, Sala>>({});
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    Promise.allSettled([bookingService.getOrder(codigo), bookingService.listTherapists(), bookingService.listRooms()]).then(
      ([o, f, s]) => {
        if (cancel) return;
        if (o.status === 'fulfilled') setOrden(o.value.data);
        else setError(o.reason instanceof Error ? o.reason.message : 'No se encontró la orden');
        if (f.status === 'fulfilled') setFisios(Object.fromEntries((f.value.data ?? []).map((x) => [x.id, x])));
        if (s.status === 'fulfilled') setSalas(Object.fromEntries((s.value.data ?? []).map((x) => [x.id, x])));
      }
    );
    return () => {
      cancel = true;
    };
  }, [codigo]);

  // Reloj para la cuenta regresiva de la reserva temporal
  useEffect(() => {
    const tick = () => setAhora(Date.now());
    const primero = setTimeout(tick, 0);
    const intervalo = setInterval(tick, 1000);
    return () => {
      clearTimeout(primero);
      clearInterval(intervalo);
    };
  }, []);

  const restanteMs = orden?.expiraEn && ahora ? new Date(orden.expiraEn).getTime() - ahora : null;
  const vencida = orden?.estado === 'PENDIENTE_PAGO' && restanteMs !== null && restanteMs <= 0;

  const pagado = useCallback(
    (o: Orden) => {
      setOrden(o);
      vaciar(true);
      toast.success('¡Pago aprobado! Tus citas están confirmadas.');
    },
    [vaciar, toast]
  );

  const cancelar = async () => {
    try {
      await bookingService.cancelOrder(codigo);
      toast.success('Horarios liberados. Tu carrito sigue intacto.');
      router.push('/carrito');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cancelar');
    }
  };

  if (error) {
    return (
      <Estado
        icono={XCircle}
        titulo="No encontramos esta orden"
        texto={error}
        accion={{ href: '/reservas', label: 'Ir a mis citas' }}
      />
    );
  }

  if (!orden) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> Cargando tu orden…
      </div>
    );
  }

  if (orden.estado === 'PAGADA') {
    return <Comprobante orden={orden} fisios={fisios} salas={salas} paciente={profile?.nombreCompleto ?? user?.nombre ?? 'Paciente'} email={profile?.email} />;
  }

  if (orden.estado !== 'PENDIENTE_PAGO' || vencida) {
    return (
      <Estado
        icono={Timer}
        titulo="Se agotó el tiempo para pagar"
        texto="Tus horarios se liberaron para otros pacientes. Tus servicios siguen en el carrito: vuelve a elegir los horarios para continuar."
        accion={{ href: '/reservas/nueva', label: 'Elegir horarios de nuevo' }}
      />
    );
  }

  const mm = Math.max(0, Math.floor((restanteMs ?? 0) / 60000));
  const ss = String(Math.max(0, Math.floor(((restanteMs ?? 0) % 60000) / 1000))).padStart(2, '0');
  const urgente = (restanteMs ?? Infinity) < 120000;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PasosCompra actual={3} />

      <div className="mt-6 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pago seguro</h1>
          <p className="mt-1 text-sm text-slate-400">
            Orden <span className="font-mono text-slate-300">{orden.codigo}</span> · tu cita se confirma al aprobarse el pago.
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border px-4 py-2.5',
            urgente ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'
          )}
          role="timer"
          aria-live="polite"
        >
          <Timer className={cn('h-5 w-5', urgente && 'animate-pulse')} />
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Horarios apartados por</p>
            <p className="font-mono text-xl font-bold tabular-nums">
              {mm}:{ss}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <FormularioPago orden={orden} onPagado={pagado} onCancelar={cancelar} />

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div className="border-b border-slate-800 px-5 py-4">
              <p className="font-semibold text-white">Tus sesiones</p>
              <p className="text-xs text-slate-500">Fisioterapeuta y sala ya asignados</p>
            </div>
            <ul className="divide-y divide-slate-800/70">
              {orden.reservas.map((r, i) => (
                <li key={r.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {i + 1}. {r.servicios?.[0]?.servicioNombre}
                    </p>
                    <span className="text-sm tabular-nums text-slate-300">{formatCurrency(Number(r.precioTotal))}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays className="h-3 w-3" />
                    {parseISODate(r.fechaHoraInicio.slice(0, 10)).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
                    {horaDe(r.fechaHoraInicio)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Stethoscope className="h-3 w-3" /> {r.fisioterapeutaId ? fisios[r.fisioterapeutaId]?.nombre : '—'}
                    <MapPin className="ml-1 h-3 w-3" /> {r.salaId ? salas[r.salaId]?.nombre : '—'}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-slate-800 bg-slate-950/40 px-5 py-4">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-2xl font-bold tabular-nums text-white">{formatCurrency(Number(orden.total))}</span>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 px-1 text-[11px] leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
            Nunca guardamos el número completo de tu tarjeta: al servidor solo viajan los últimos 4 dígitos.
          </p>
        </aside>
      </div>
    </div>
  );
}

// ─── Formulario con los métodos de pago ──────────────────────────────
function FormularioPago({ orden, onPagado, onCancelar }: { orden: Orden; onPagado: (o: Orden) => void; onCancelar: () => void }) {
  const [metodo, setMetodo] = useState<MetodoPago>('TARJETA');
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [venc, setVenc] = useState('');
  const [cvv, setCvv] = useState('');
  const [telefono, setTelefono] = useState('');
  const [codigoAprob, setCodigoAprob] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pruebaAbierta, setPruebaAbierta] = useState(true);

  const digitos = soloDigitos(numero);
  const marca = marcaDe(digitos);
  const largoCvv = marca === 'Amex' ? 4 : 3;

  const errores = useMemo(() => {
    if (metodo !== 'TARJETA') {
      return {
        telefono: /^9\d{8}$/.test(telefono) ? null : 'Celular de 9 dígitos que empieza con 9',
        codigo: /^\d{6}$/.test(codigoAprob) ? null : 'Código de 6 dígitos',
      };
    }
    const [m, a] = venc.split('/').map(Number);
    const hoy = new Date();
    const vencValido = m >= 1 && m <= 12 && a >= 0 && new Date(2000 + a, m, 1) > hoy;
    return {
      numero: luhn(digitos) ? null : 'Número de tarjeta inválido',
      titular: titular.trim().length >= 3 ? null : 'Nombre como figura en la tarjeta',
      venc: vencValido ? null : 'Fecha MM/AA vigente',
      cvv: new RegExp(`^\\d{${largoCvv}}$`).test(cvv) ? null : `${largoCvv} dígitos`,
    };
  }, [metodo, telefono, codigoAprob, venc, digitos, titular, cvv, largoCvv]);
  const valido = Object.values(errores).every((e) => !e);

  const usarPrueba = (p: (typeof DATOS_PRUEBA)[number]) => {
    setError(null);
    if (p.metodo === 'TARJETA') {
      setMetodo('TARJETA');
      setNumero(p.numero!.replace(/(\d{4})(?=\d)/g, '$1 '));
      setVenc(p.venc!);
      setCvv(p.cvv!);
      if (!titular) setTitular('Paciente Demo');
    } else {
      if (metodo === 'TARJETA') setMetodo('YAPE');
      setTelefono(p.telefono!);
      setCodigoAprob(p.codigo!);
    }
  };

  const pagar = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!valido || procesando) return;
    setProcesando(true);
    setError(null);
    const espera = new Promise((r) => setTimeout(r, 1200)); // simula la autorización del banco
    try {
      const [res] = await Promise.all([
        bookingService.payOrder(
          orden.codigo,
          metodo === 'TARJETA'
            ? { metodo, titular: titular.trim(), marca: marca ?? 'Tarjeta', ultimos4: digitos.slice(-4) }
            : { metodo, telefono, codigoAprobacion: codigoAprob }
        ),
        espera,
      ]);
      onPagado(res.data);
    } catch (err) {
      await espera;
      setError(err instanceof Error ? err.message : 'No se pudo procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={pagar} className="min-w-0 space-y-5">
      {/* Selector de método */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Método de pago">
        {(
          [
            { id: 'TARJETA', label: 'Tarjeta', sub: 'Crédito o débito', icon: CreditCard, color: 'from-slate-200 to-slate-400' },
            { id: 'YAPE', label: 'Yape', sub: 'Pago con QR', icon: Smartphone, color: 'from-fuchsia-500 to-purple-700' },
            { id: 'PLIN', label: 'Plin', sub: 'Pago con QR', icon: Smartphone, color: 'from-cyan-400 to-sky-600' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={metodo === m.id}
            onClick={() => {
              setMetodo(m.id);
              setError(null);
            }}
            className={cn(
              'flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all',
              metodo === m.id ? 'border-teal-400/70 bg-teal-500/10 ring-2 ring-teal-500/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            )}
          >
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white', m.color)}>
              <m.icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">{m.label}</span>
              <span className="block text-[11px] text-slate-500">{m.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
        <AnimatePresence mode="wait">
          {metodo === 'TARJETA' ? (
            <motion.div key="tarjeta" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
              <TarjetaVista numero={digitos} titular={titular} venc={venc} marca={marca} />
              <div className="grid gap-3">
                <Campo label="Número de tarjeta" error={numero && errores.numero}>
                  <input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={numero}
                    onChange={(e) => setNumero(soloDigitos(e.target.value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '))}
                    className={entrada}
                  />
                </Campo>
                <Campo label="Titular" error={titular && errores.titular}>
                  <input autoComplete="cc-name" placeholder="Como figura en la tarjeta" value={titular} onChange={(e) => setTitular(e.target.value.toUpperCase())} className={entrada} />
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Vencimiento" error={venc.length === 5 && errores.venc}>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      value={venc}
                      onChange={(e) => {
                        const d = soloDigitos(e.target.value).slice(0, 4);
                        setVenc(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                      }}
                      className={entrada}
                    />
                  </Campo>
                  <Campo label="CVV" error={cvv && errores.cvv}>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      type="password"
                      placeholder={'•'.repeat(largoCvv)}
                      value={cvv}
                      onChange={(e) => setCvv(soloDigitos(e.target.value).slice(0, largoCvv))}
                      className={entrada}
                    />
                  </Campo>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="billetera" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
              <div className="flex flex-col items-center">
                <div className={cn('rounded-2xl p-3', metodo === 'YAPE' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-700' : 'bg-gradient-to-br from-cyan-400 to-sky-600')}>
                  <QrFicticio semilla={orden.codigo} />
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">
                  {metodo === 'YAPE' ? 'Yapea' : 'Plinea'} a <span className="font-semibold text-white">FisioMarca</span>
                  <br />
                  <span className="font-mono text-slate-300">987 654 321</span>
                </p>
              </div>
              <div className="grid content-start gap-3">
                <ol className="space-y-1 text-xs text-slate-400">
                  <li>1. Abre {METODO_LABEL[metodo]} y escanea el código o usa el número.</li>
                  <li>2. Paga <span className="font-semibold text-white">{formatCurrency(Number(orden.total))}</span>.</li>
                  <li>3. Escribe tu celular y el código de aprobación de 6 dígitos.</li>
                </ol>
                <Campo label="Tu celular" error={telefono && errores.telefono}>
                  <input inputMode="numeric" placeholder="9XXXXXXXX" value={telefono} onChange={(e) => setTelefono(soloDigitos(e.target.value).slice(0, 9))} className={entrada} />
                </Campo>
                <Campo label="Código de aprobación" error={codigoAprob && errores.codigo}>
                  <input
                    inputMode="numeric"
                    placeholder="000000"
                    value={codigoAprob}
                    onChange={(e) => setCodigoAprob(soloDigitos(e.target.value).slice(0, 6))}
                    className={cn(entrada, 'font-mono tracking-[0.4em]')}
                  />
                </Campo>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={!valido || procesando}
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 py-3.5 text-base font-semibold text-slate-950 shadow-[0_10px_40px_-12px_rgba(45,212,191,0.7)] transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          {procesando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
          {procesando ? 'Procesando pago…' : `Pagar ${formatCurrency(Number(orden.total))}`}
        </button>
        <button type="button" onClick={onCancelar} disabled={procesando} className="mt-3 w-full text-center text-xs text-slate-500 hover:text-rose-300">
          Cancelar y liberar mis horarios
        </button>
      </div>

      {/* Datos ficticios para la demo */}
      <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/[0.04]">
        <button
          type="button"
          onClick={() => setPruebaAbierta(!pruebaAbierta)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left"
          aria-expanded={pruebaAbierta}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-amber-200">
            <FlaskConical className="h-4 w-4" /> Modo de prueba: datos ficticios
          </span>
          <ChevronDown className={cn('h-4 w-4 text-amber-200/70 transition-transform', pruebaAbierta && 'rotate-180')} />
        </button>
        {pruebaAbierta && (
          <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
            {DATOS_PRUEBA.map((p) => (
              <button
                key={p.titulo}
                type="button"
                onClick={() => usarPrueba(p)}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-left transition-colors hover:border-amber-300/40"
              >
                <span className={cn('text-xs font-semibold', p.titulo.includes('rechaz') ? 'text-rose-300' : 'text-emerald-300')}>{p.titulo}</span>
                <span className="block font-mono text-[11px] text-slate-400">{p.detalle}</span>
              </button>
            ))}
            <p className="text-[11px] text-slate-500 sm:col-span-2">Ningún pago es real. Toca una opción para llenar el formulario.</p>
          </div>
        )}
      </div>
    </form>
  );
}

const entrada =
  'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

function Campo({ label, error, children }: { label: string; error?: string | null | false | ''; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-rose-300">{error}</span>}
    </label>
  );
}

function TarjetaVista({ numero, titular, venc, marca }: { numero: string; titular: string; venc: string; marca: string | null }) {
  const grupos = numero.padEnd(16, '•').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  return (
    <div className="relative aspect-[1.586] w-full max-w-[260px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-900 to-teal-900 p-4 text-white shadow-2xl ring-1 ring-white/10">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" />
        <span className="text-sm font-bold italic tracking-wide">{marca ?? 'TARJETA'}</span>
      </div>
      <p className="mt-6 font-mono text-[15px] tracking-[0.12em]">{grupos}</p>
      <div className="mt-4 flex items-end justify-between text-[10px] uppercase">
        <div className="min-w-0">
          <p className="opacity-60">Titular</p>
          <p className="truncate text-xs font-semibold">{titular || 'NOMBRE APELLIDO'}</p>
        </div>
        <div className="text-right">
          <p className="opacity-60">Vence</p>
          <p className="text-xs font-semibold">{venc || 'MM/AA'}</p>
        </div>
      </div>
    </div>
  );
}

// Patrón tipo QR generado a partir del código de la orden (decorativo, no escaneable)
function QrFicticio({ semilla }: { semilla: string }) {
  const n = 21;
  let h = 0;
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const celdas: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    celdas.push(((h >>> 16) & 1) === 1);
  }
  const esOjo = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-36 w-36 rounded-lg bg-white p-1.5" aria-label="Código QR de pago (demostración)">
      {celdas.map((v, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        if (esOjo(x, y)) return null;
        return v ? <rect key={i} x={x} y={y} width="1" height="1" fill="#0f172a" /> : null;
      })}
      {[
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#0f172a" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}

// ─── Comprobante tras el pago ────────────────────────────────────────
function Comprobante({
  orden,
  fisios,
  salas,
  paciente,
  email,
}: {
  orden: Orden;
  fisios: Record<number, Fisioterapeuta>;
  salas: Record<number, Sala>;
  paciente: string;
  email?: string;
}) {
  const filas = orden.reservas.map((r) => ({
    fecha: parseISODate(r.fechaHoraInicio.slice(0, 10)).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    hora: `${horaDe(r.fechaHoraInicio)}–${horaDe(r.fechaHoraFin)}`,
    tratamiento: r.servicios?.[0]?.servicioNombre ?? 'Sesión',
    fisioterapeuta: r.fisioterapeutaId ? fisios[r.fisioterapeutaId]?.nombre ?? '—' : '—',
    sala: r.salaId ? salas[r.salaId]?.nombre ?? '—' : '—',
    precio: formatCurrency(Number(r.precioTotal)),
  }));
  const metodo = METODO_LABEL[orden.metodoPago ?? ''] ?? 'Online';
  const fechaPago = orden.fechaPago ? formatDateTime(orden.fechaPago) : '—';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PasosCompra actual={4} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/80 shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent px-6 py-10 text-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_0_10px_rgba(16,185,129,0.15)]"
          >
            <CheckCircle2 className="h-9 w-9" />
          </motion.span>
          <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl">¡Pago aprobado!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Tus {orden.reservas.length} {orden.reservas.length === 1 ? 'cita quedó confirmada' : 'citas quedaron confirmadas'}. Te esperamos 10 minutos antes.
          </p>
        </div>

        <div className="grid gap-4 border-y border-slate-800 px-6 py-5 text-sm sm:grid-cols-3">
          <Dato etiqueta="Orden" valor={<span className="font-mono">{orden.codigo}</span>} />
          <Dato etiqueta="Método" valor={`${metodo} · ${orden.pagoReferencia ?? ''}`} />
          <Dato etiqueta="Fecha de pago" valor={fechaPago} />
        </div>

        <ul className="divide-y divide-slate-800/70 px-6">
          {filas.map((f, i) => (
            <li key={i} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{f.tratamiento}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {f.fecha}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {f.hora}</span>
                  <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {f.fisioterapeuta} · {f.sala}</span>
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-200">{f.precio}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 border-t border-slate-800 bg-slate-950/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Total pagado</p>
            <p className="text-2xl font-bold tabular-nums text-white">{formatCurrency(Number(orden.total))}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Descargar comprobante</span>
            <ExportButtons
              onPDF={() =>
                comprobantePDF({
                  codigo: orden.codigo,
                  paciente,
                  email,
                  fechaPago,
                  metodo,
                  referencia: orden.pagoReferencia ?? '',
                  total: formatCurrency(Number(orden.total)),
                  sesiones: filas,
                })
              }
              onExcel={() =>
                exportarExcel(
                  {
                    titulo: `Comprobante ${orden.codigo}`,
                    subtitulo: `${paciente} · ${metodo} ${orden.pagoReferencia ?? ''}`,
                    columnas: ['Sesión', 'Fecha', 'Hora', 'Tratamiento', 'Fisioterapeuta', 'Sala', 'Precio'],
                    filas: filas.map((f, i) => [i + 1, f.fecha, f.hora, f.tratamiento, f.fisioterapeuta, f.sala, f.precio]),
                    resumen: [['Total pagado', formatCurrency(Number(orden.total))]],
                    archivo: `comprobante-${orden.codigo}`,
                  },
                  'Comprobante'
                )
              }
            />
          </div>
        </div>
      </motion.div>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/reservas" className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25">
          Ver mis citas
        </Link>
        <Link href="/servicios" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-6 text-sm font-medium text-slate-200 hover:bg-slate-800">
          Seguir explorando
        </Link>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{etiqueta}</p>
      <p className="mt-0.5 truncate font-medium text-slate-200">{valor}</p>
    </div>
  );
}

function Estado({
  icono: Icono,
  titulo,
  texto,
  accion,
}: {
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
  accion: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
        <Icono className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold text-white">{titulo}</h1>
      <p className="mt-2 text-sm text-slate-400">{texto}</p>
      <Link
        href={accion.href}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25"
      >
        {accion.label}
      </Link>
    </div>
  );
}
