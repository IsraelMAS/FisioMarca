'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, MotionConfig, useInView, animate, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  LayoutDashboard,
  LayoutGrid,
  Quote,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  UserPlus,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';
import { Testimonios } from '@/components/home/testimonios';

// ─── Inicio: landing ligera ──────────────────────────────────────────
// Solo presenta la clínica y reparte al usuario hacia las otras páginas
// (servicios, categorías, citas, panel). El catálogo completo vive en /servicios.

// Copias optimizadas (1600px, ~200 KB) de public/images/services/Inicio-fisio*.jpg
const IMG = {
  hero: '/images/inicio/fisio-1.jpg',
  nosotros: '/images/inicio/fisio-2.jpg',
  banda: '/images/inicio/fisio-3.jpg',
  rodilla: '/images/inicio/fisio-4.jpg',
};

const EASE = [0.22, 1, 0.36, 1] as const;

const aparecer: Variants = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const cascada: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// Props comunes: anima una sola vez al entrar en pantalla
const alVer = {
  initial: 'oculto',
  whileInView: 'visible',
  viewport: { once: true, margin: '-80px' },
} as const;

interface Acceso {
  href: string;
  titulo: string;
  texto: string;
  icono: LucideIcon;
}

const ACCESOS_INVITADO: Acceso[] = [
  { href: '/servicios', titulo: 'Servicios', texto: 'Tratamientos con precio y duración por sesión.', icono: Stethoscope },
  { href: '/categorias', titulo: 'Categorías', texto: 'Encuentra tu terapia según la especialidad.', icono: LayoutGrid },
  { href: '/login?redirect=/reservas/nueva', titulo: 'Reservar cita', texto: 'Inicia sesión y agenda en segundos.', icono: CalendarDays },
  { href: '/registro', titulo: 'Crear cuenta', texto: 'Guarda tus citas y sigue tu evolución.', icono: UserPlus },
];

const ACCESOS_PACIENTE: Acceso[] = [
  { href: '/reservas/nueva', titulo: 'Nueva cita', texto: 'Elige tratamiento, día y hora.', icono: CalendarDays },
  { href: '/reservas', titulo: 'Mis citas', texto: 'Revisa, paga o reprograma tus sesiones.', icono: CalendarCheck },
  { href: '/servicios', titulo: 'Servicios', texto: 'Tratamientos con precio y duración por sesión.', icono: Stethoscope },
  { href: '/categorias', titulo: 'Categorías', texto: 'Encuentra tu terapia según la especialidad.', icono: LayoutGrid },
];

const ACCESOS_ADMIN: Acceso[] = [
  { href: '/dashboard', titulo: 'Panel', texto: 'Indicadores y actividad de la clínica.', icono: LayoutDashboard },
  { href: '/dashboard/agenda', titulo: 'Agenda', texto: 'Sesiones del día por fisioterapeuta.', icono: CalendarCheck },
  { href: '/dashboard/servicios', titulo: 'Servicios', texto: 'Gestiona precios, imágenes y estado.', icono: Stethoscope },
  { href: '/dashboard/categorias', titulo: 'Categorías', texto: 'Organiza las especialidades.', icono: LayoutGrid },
];

const BENEFICIOS = [
  { icono: UserRound, titulo: 'Atención 1 a 1', texto: 'Un fisioterapeuta dedicado durante toda tu sesión.' },
  { icono: Award, titulo: 'Especialistas colegiados', texto: 'Profesionales con formación y experiencia clínica.' },
  { icono: HeartPulse, titulo: 'Equipamiento moderno', texto: 'Terapia manual combinada con tecnología.' },
  { icono: CalendarCheck, titulo: 'Reserva online', texto: 'Agenda, paga y reprograma desde tu cuenta.' },
];

const PROCESO = [
  { icono: ClipboardCheck, titulo: 'Evaluación', texto: 'Analizamos postura, rango articular y origen del dolor.' },
  { icono: Sparkles, titulo: 'Tratamiento', texto: 'Plan personalizado con terapia manual y ejercicio guiado.' },
  { icono: TrendingUp, titulo: 'Seguimiento', texto: 'Medimos tu evolución sesión a sesión hasta el alta.' },
];

// Número que cuenta desde 0 al entrar en pantalla (sin re-render: escribe en el nodo)
function Contador({ hasta, sufijo = '' }: { hasta: number; sufijo?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true });

  useEffect(() => {
    const nodo = ref.current;
    if (!visto || !nodo) return;
    const pintar = (v: number) => {
      nodo.textContent = `${Math.round(v).toLocaleString('es-PE')}${sufijo}`;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pintar(hasta);
      return;
    }
    const control = animate(0, hasta, { duration: 1.6, ease: EASE, onUpdate: pintar });
    return () => control.stop();
  }, [visto, hasta, sufijo]);

  return <span ref={ref}>0{sufijo}</span>;
}

export default function HomePage() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const accesos = isAdmin ? ACCESOS_ADMIN : isAuthenticated ? ACCESOS_PACIENTE : ACCESOS_INVITADO;
  const principal = isAdmin
    ? { href: '/dashboard', texto: 'Ir al panel', icono: LayoutDashboard }
    : { href: isAuthenticated ? '/reservas/nueva' : '/login?redirect=/reservas/nueva', texto: 'Reservar cita', icono: CalendarDays };
  const secundario = isAuthenticated && !isAdmin
    ? { href: '/reservas', texto: 'Mis citas' }
    : { href: '/servicios', texto: 'Ver servicios' };
  const PrincipalIcono = principal.icono;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
          <div className="pointer-events-none absolute -top-24 left-1/4 h-[380px] w-[560px] rounded-full bg-teal-500/15 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-emerald-500/10 blur-[110px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            {/* Texto */}
            <motion.div initial="oculto" animate="visible" variants={cascada} className="space-y-7">
              <motion.div
                variants={aparecer}
                className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-300"
              >
                <Sparkles className="h-4 w-4 text-teal-400" />
                {isAuthenticated && user?.nombre
                  ? `Hola, ${user.nombre.split(' ')[0]}. ¡Qué bueno verte!`
                  : 'Fisioterapia & Rehabilitación Integral'}
              </motion.div>

              <motion.h1
                variants={aparecer}
                className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                Recupérate mejor y vuelve a moverte{' '}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  sin límites
                </span>
              </motion.h1>

              <motion.p variants={aparecer} className="max-w-lg text-lg leading-relaxed text-slate-400">
                Rehabilitación física, neurológica y terapia manual con fisioterapeutas
                colegiados y un plan hecho a tu medida.
              </motion.p>

              <motion.div variants={aparecer} className="flex flex-col gap-3 sm:flex-row">
                <Link href={principal.href} className={cn(buttonVariants({ size: 'lg' }), 'group')}>
                  <PrincipalIcono className="h-5 w-5" />
                  {principal.texto}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href={secundario.href} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                  {secundario.texto}
                </Link>
              </motion.div>

              {/* Prueba social */}
              <motion.div variants={aparecer} className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-3">
                  {['C', 'V', 'M'].map((l) => (
                    <span
                      key={l}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-bold text-white"
                    >
                      {l}
                    </span>
                  ))}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-[11px] font-bold text-teal-300">
                    +1.5K
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-white">5.0</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Pacientes satisfechos</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Collage de imágenes */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              className="grid grid-cols-2 gap-4"
            >
              <TarjetaFoto src={IMG.banda} alt="Paciente con banda elástica guiado por su fisioterapeuta" className="h-32 sm:h-40">
                <span className="text-2xl font-bold">
                  <Contador hasta={1500} sufijo="+" />
                </span>
                <span className="text-xs opacity-80">Pacientes atendidos</span>
              </TarjetaFoto>
              <TarjetaFoto src={IMG.rodilla} alt="Fisioterapeuta movilizando la rodilla de un paciente" className="h-32 sm:h-40">
                <span className="text-2xl font-bold">
                  <Contador hasta={10} sufijo="+" />
                </span>
                <span className="text-xs opacity-80">Años de trayectoria</span>
              </TarjetaFoto>

              <div className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-3xl border border-slate-800 sm:aspect-[16/11]">
                <Image
                  src={IMG.hero}
                  alt="Fisioterapeuta asistiendo a una paciente en un ejercicio con pesa rusa"
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-[#042f2e]/80 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md">
                  <Quote className="h-4 w-4 text-teal-300" />
                  Muévete mejor. Vive mejor.
                </div>
                <div className="flotar absolute top-4 right-4 flex items-center gap-2 rounded-xl bg-[#042f2e]/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Citas disponibles hoy
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Banda de beneficios ──────────────────────────────────── */}
        <section className="bg-gradient-to-r from-teal-500 to-emerald-600">
          <motion.div
            {...alVer}
            variants={cascada}
            className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"
          >
            {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
              <motion.div key={titulo} variants={aparecer} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
                  <Icono className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/80">{texto}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ─── Accesos rápidos (cambian según la sesión) ────────────── */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...alVer} variants={aparecer} className="mb-10 max-w-2xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-400">
                {isAdmin ? 'Administración' : isAuthenticated ? 'Tu espacio' : 'Explora'}
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {isAdmin ? 'Gestiona la clínica' : isAuthenticated ? '¿Qué quieres hacer hoy?' : 'Empieza por aquí'}
              </h2>
            </motion.div>

            <motion.div {...alVer} variants={cascada} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {accesos.map(({ href, titulo, texto, icono: Icono }) => (
                <motion.div key={href} variants={aparecer}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-500/10"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                      <Icono className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{titulo}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">{texto}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-400">
                      Ir ahora
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Sobre nosotros ───────────────────────────────────────── */}
        <section className="border-t border-slate-900 bg-slate-900/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              {...alVer}
              variants={aparecer}
              className="flex flex-col gap-8 border-b border-slate-800 pb-10 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-xl">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-400">Sobre nosotros</p>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Te acompañamos en cada paso de tu recuperación
                </h2>
              </div>
              <div className="flex divide-x divide-slate-800">
                {[
                  { hasta: 10, sufijo: '+', texto: 'Años de experiencia' },
                  { hasta: 1500, sufijo: '+', texto: 'Pacientes atendidos' },
                  { hasta: 99, sufijo: '%', texto: 'Satisfacción' },
                ].map((s) => (
                  <div key={s.texto} className="px-5 first:pl-0 last:pr-0 sm:px-8">
                    <p className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-3xl font-bold text-transparent">
                      <Contador hasta={s.hasta} sufijo={s.sufijo} />
                    </p>
                    <p className="mt-1 text-xs text-slate-400 sm:text-sm">{s.texto}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
              <motion.div {...alVer} variants={aparecer}>
                <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-slate-800">
                  <Image
                    src={IMG.nosotros}
                    alt="Fisioterapeuta acompañando a una paciente en una máquina de rehabilitación"
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">Bienvenido a FisioMarca</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Somos un centro de fisioterapia enfocado en la raíz del problema, no solo en
                  aliviar síntomas. Cada paciente recibe un diagnóstico claro y un plan de
                  tratamiento con objetivos medibles.
                </p>
              </motion.div>

              <motion.div {...alVer} variants={cascada} className="space-y-8">
                <motion.div variants={aparecer}>
                  <h3 className="text-xl font-bold text-white">Nuestra misión</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    Devolverte la movilidad y la confianza en tu cuerpo con terapias basadas en
                    evidencia, trato cercano y una experiencia de reserva sin complicaciones.
                  </p>
                </motion.div>

                <motion.div variants={aparecer}>
                  <h3 className="mb-5 text-xl font-bold text-white">Tu proceso de recuperación</h3>
                  <ol className="relative space-y-6 border-l border-slate-800 pl-8">
                    {PROCESO.map(({ icono: Icono, titulo, texto }, i) => (
                      <motion.li key={titulo} variants={aparecer} className="relative">
                        <span className="absolute -left-[3.05rem] flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/40 bg-slate-950 text-teal-400">
                          <Icono className="h-4 w-4" />
                        </span>
                        <p className="text-xs font-semibold text-teal-400">Paso {i + 1}</p>
                        <h4 className="font-semibold text-white">{titulo}</h4>
                        <p className="mt-0.5 text-sm text-slate-400">{texto}</p>
                      </motion.li>
                    ))}
                  </ol>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <Testimonios />

        {/* ─── CTA final ────────────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <motion.div
            {...alVer}
            variants={aparecer}
            className="relative mx-4 max-w-6xl overflow-hidden rounded-3xl sm:mx-6 lg:mx-auto"
          >
            {/* Reutiliza la foto del hero: ya está en caché, no suma peso */}
            <Image src={IMG.hero} alt="" fill sizes="(max-width: 1200px) 100vw, 1150px" className="object-cover" />
            <div className="relative bg-[#042f2e]/85 px-6 py-14 text-center sm:px-12 md:py-20">
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
                {isAdmin ? 'Todo listo para la jornada de hoy' : '¿Listo para dar el primer paso?'}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/75">
                {isAdmin
                  ? 'Revisa la agenda, confirma reservas y mantén el catálogo al día.'
                  : 'Agenda tu cita con nuestros especialistas y recibe un plan terapéutico a tu medida.'}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={principal.href} className={cn(buttonVariants({ size: 'lg' }), 'group')}>
                  <PrincipalIcono className="h-5 w-5" />
                  {principal.texto}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    href="/registro"
                    className={cn(
                      buttonVariants({ size: 'lg', variant: 'ghost' }),
                      'border border-white/30 text-white hover:bg-white/10 hover:text-white'
                    )}
                  >
                    Crear cuenta gratis
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </MotionConfig>
  );
}

// Foto pequeña del collage con un dato encima
function TarjetaFoto({
  src,
  alt,
  className,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('group relative overflow-hidden rounded-2xl border border-slate-800', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 50vw, 300px"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-x-2 bottom-2 flex flex-col rounded-xl bg-[#042f2e]/80 px-3 py-2 leading-tight text-white backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
