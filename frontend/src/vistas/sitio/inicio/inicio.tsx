'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  ArrowRight,
  Activity,
  HeartPulse,
  CheckCircle2,
  ShoppingCart,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDuration } from '@/lib/format';
import { catalogService } from '@/lib/api/catalog.service';
import { CartControl, ReservarBoton } from '@/components/cart/cart-control';
import { useAuth } from '@/lib/auth/context';
import type { Servicio, Categoria } from '@/types';
import { Testimonios } from '@/components/home/testimonios';

// Catálogo de respaldo (igual al de sql/fisiomarca.sql) si el backend no responde
const DEMO_CATEGORIES: Categoria[] = [
  { id: 0, nombre: 'Todos', descripcion: 'Ver todos los tratamientos', imagenUrl: null, activo: true },
  { id: 1, nombre: 'Postoperatorio', descripcion: 'Recuperación quirúrgica', imagenUrl: null, activo: true },
  { id: 2, nombre: 'Neurología Funcional', descripcion: 'Rehabilitación neuromotora', imagenUrl: null, activo: true },
  { id: 3, nombre: 'Músculo y Articular', descripcion: 'Dolores, contracturas y lesiones', imagenUrl: null, activo: true },
  { id: 4, nombre: 'Técnicas Manuales', descripcion: 'Masajes y descargas', imagenUrl: null, activo: true },
  { id: 5, nombre: 'Bienestar Integral', descripcion: 'Prevención y terapias de calor', imagenUrl: null, activo: true },
];

const DEMO_SERVICES: Servicio[] = [
  {
    id: 1,
    nombre: 'Post operatorio',
    descripcion: 'Fisioterapia especializada post cirugía para reducir inflamación y recuperar rango motriz de forma segura.',
    precio: 80.0,
    duracionMinutos: 60,
    imagenUrl: '/images/services/post-operatorio.jpeg',
    activo: true,
    categoriaId: 1,
    categoriaNombre: 'Postoperatorio',
  },
  {
    id: 2,
    nombre: 'Parálisis facial',
    descripcion: 'Estimulación neuromuscular dirigida, reeducación del tono muscular y ejercicios de mímica facial.',
    precio: 70.0,
    duracionMinutos: 50,
    imagenUrl: '/images/services/paralisis-facial.jpeg',
    activo: true,
    categoriaId: 2,
    categoriaNombre: 'Neurología Funcional',
  },
  {
    id: 3,
    nombre: 'Desgarros musculares',
    descripcion: 'Protocolo de cicatrización tisular, regeneración de fibras y reacondicionamiento funcional progresivo.',
    precio: 65.0,
    duracionMinutos: 50,
    imagenUrl: '/images/services/desgarros.jpeg',
    activo: true,
    categoriaId: 3,
    categoriaNombre: 'Músculo y Articular',
  },
  {
    id: 4,
    nombre: 'Lumbalgia',
    descripcion: 'Alivio inmediato de dolor en zona baja de espalda, descompresión postural y fortalecimiento lumbar.',
    precio: 55.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/lumbalgia.jpeg',
    activo: true,
    categoriaId: 3,
    categoriaNombre: 'Músculo y Articular',
  },
  {
    id: 5,
    nombre: 'Piedras calientes',
    descripcion: 'Termoterapia natural que disuelve contracturas profundas, mejora la irrigación y equilibra el estrés.',
    precio: 50.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/piedras-calientes.jpeg',
    activo: true,
    categoriaId: 5,
    categoriaNombre: 'Bienestar Integral',
  },
  {
    id: 6,
    nombre: 'Cervicalgia',
    descripcion: 'Tratamiento focalizado para dolor cervical, tensión de cuello, hombros y dolor de cabeza tensional.',
    precio: 55.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/cervicalgia.jpeg',
    activo: true,
    categoriaId: 3,
    categoriaNombre: 'Músculo y Articular',
  },
  {
    id: 7,
    nombre: 'ACV (Rehabilitación)',
    descripcion: 'Recuperación integral neuromotora, marcha, equilibrio e independencia motora con terapeutas calificados.',
    precio: 90.0,
    duracionMinutos: 60,
    imagenUrl: '/images/services/acv.jpeg',
    activo: true,
    categoriaId: 2,
    categoriaNombre: 'Neurología Funcional',
  },
  {
    id: 8,
    nombre: 'Lesión de ligamentos',
    descripcion: 'Fortalecimiento, estabilidad ligamentosa y propiocepción para ligamentos cruzados, colaterales y tobillos.',
    precio: 75.0,
    duracionMinutos: 55,
    imagenUrl: '/images/services/ligamentos.jpeg',
    activo: true,
    categoriaId: 3,
    categoriaNombre: 'Músculo y Articular',
  },
  {
    id: 9,
    nombre: 'Masaje reductor',
    descripcion: 'Masaje mecánico focalizado y drenaje para activar el retorno linfático y reducir medidas corporales.',
    precio: 45.0,
    duracionMinutos: 40,
    imagenUrl: '/images/services/masaje-reductor.jpeg',
    activo: true,
    categoriaId: 4,
    categoriaNombre: 'Técnicas Manuales',
  },
  {
    id: 10,
    nombre: 'Ventosas (Cupping)',
    descripcion: 'Terapia descompresiva de vacío que libera miofascia, elimina toxinas y acelera la recuperación tisular.',
    precio: 40.0,
    duracionMinutos: 35,
    imagenUrl: '/images/services/ventosas.jpeg',
    activo: true,
    categoriaId: 5,
    categoriaNombre: 'Bienestar Integral',
  },
  {
    id: 11,
    nombre: 'Vendaje neuromuscular',
    descripcion: 'Aplicación experta de Kinesiotape para inhibición o activación muscular, analgesia y soporte continuo.',
    precio: 35.0,
    duracionMinutos: 30,
    imagenUrl: '/images/services/vendaje-neuromuscular.jpeg',
    activo: true,
    categoriaId: 3,
    categoriaNombre: 'Músculo y Articular',
  },
  {
    id: 12,
    nombre: 'Masaje relajante',
    descripcion: 'Sesión antiestrés para liberar endorfinas, relajar el sistema nervioso central y reducir el insomnio.',
    precio: 40.0,
    duracionMinutos: 40,
    imagenUrl: '/images/services/relajante.jpeg',
    activo: true,
    categoriaId: 4,
    categoriaNombre: 'Técnicas Manuales',
  },
  {
    id: 13,
    nombre: 'Masaje descontracturante',
    descripcion: 'Presión media-alta para deshacer nódulos miofasciales dolorosos y recuperar la elasticidad perdida.',
    precio: 45.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/descontracturante.jpeg',
    activo: true,
    categoriaId: 4,
    categoriaNombre: 'Técnicas Manuales',
  },
  {
    id: 14,
    nombre: 'Descarga muscular',
    descripcion: 'Especial para atletas y personas con sobrecarga deportiva: drena ácido láctico y previene lesiones.',
    precio: 50.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/descarga-muscular.jpeg',
    activo: true,
    categoriaId: 4,
    categoriaNombre: 'Técnicas Manuales',
  },
  {
    id: 15,
    nombre: 'Evaluación postural',
    descripcion: 'Análisis y corrección de postura con plan personalizado de ejercicios.',
    precio: 45.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/evaluacion-postural.jpg',
    activo: true,
    categoriaId: 5,
    categoriaNombre: 'Bienestar Integral',
  },
  {
    id: 16,
    nombre: 'Ejercicios preventivos',
    descripcion: 'Rutina guiada de equilibrio y fortalecimiento para prevenir lesiones.',
    precio: 40.0,
    duracionMinutos: 50,
    imagenUrl: '/images/services/ejercicios-preventivos.jpg',
    activo: true,
    categoriaId: 5,
    categoriaNombre: 'Bienestar Integral',
  },
  {
    id: 17,
    nombre: 'Esguince de tobillo',
    descripcion: 'Rehabilitación de ligamentos del tobillo con vendaje y readaptación progresiva.',
    precio: 52.0,
    duracionMinutos: 45,
    imagenUrl: '/images/services/esguince-tobillo.jpg',
    activo: true,
    categoriaId: 3,
    categoriaNombre: 'Músculo y Articular',
  },
];

export default function HomePage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const agendarHref = isAdmin ? '/dashboard/reservas' : '/reservas/nueva';
  const [services, setServices] = useState<Servicio[]>(DEMO_SERVICES);
  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Cargar servicios en vivo del microservicio Catálogo (Gateway :8080)
  useEffect(() => {
    catalogService
      .getActiveServices()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setServices(res.data);
        }
      })
      .catch(() => {
        // En caso de que el backend no esté encendido aún, los datos demo quedan activos
      });
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCat === 0 || s.categoriaId === selectedCat;
      const matchSearch =
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCat, searchTerm]);


  return (
    <div className="relative min-h-screen">
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-medium backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>Centro de Fisioterapia & Rehabilitación Integral</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
            >
              Recupera tu bienestar y vuelve a moverte{' '}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                sin límites
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto"
            >
              Tratamientos personalizados en rehabilitación física, neurológica,
              dolor muscular y masajes terapéuticos de la mano de fisioterapeutas colegiados.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href="#catalogo">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-teal-500/25">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Explorar Tratamientos
                </Button>
              </Link>
              <Link href={agendarHref}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 hover:border-teal-500/50"
                >
                  Agendar Cita Directa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>Atención Personalizada 1 a 1</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-400" />
                <span>Especialistas Colegiados</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-teal-400" />
                <span>Equipamiento Moderno</span>
              </div>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl">
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                +1,500
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Pacientes Recuperados</p>
            </div>
            <div className="text-center border-l border-slate-800">
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                99%
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Satisfacción Clínica</p>
            </div>
            <div className="text-center border-l border-slate-800">
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                14+
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Servicios de Fisioterapia</p>
            </div>
            <div className="text-center border-l border-slate-800">
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                10+
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Años de Trayectoria</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Catálogo de Servicios Interactivo ────────────────────────── */}
      <section id="catalogo" className="py-16 md:py-24 border-t border-slate-900/80 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-teal-400 text-sm font-semibold tracking-wide uppercase mb-2">
                <Activity className="h-4 w-4" />
                <span>Nuestros Tratamientos</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Catálogo Clínico y Terapias
              </h2>
              <p className="text-slate-400 mt-2 text-base">
                Selecciona tu tratamiento, agenda tu horario o añade a tu carrito de atención.
              </p>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o síntoma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Filtros de Categoría */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
            {DEMO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedCat === cat.id
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Grid de Servicios */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 p-8">
              <p className="text-slate-400 text-lg">No encontramos servicios con ese criterio.</p>
              <button
                onClick={() => {
                  setSelectedCat(0);
                  setSearchTerm('');
                }}
                className="mt-4 text-teal-400 hover:underline text-sm"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300"
                >
                  {/* Imagen del Servicio */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                    {service.imagenUrl ? (
                      <Image
                        src={service.imagenUrl}
                        alt={service.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-600">
                        <Activity className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Badge Categoría */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="success" className="bg-slate-950/75 backdrop-blur-md">
                        {service.categoriaNombre || 'Fisioterapia'}
                      </Badge>
                    </div>

                    {/* Duración */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-xs text-slate-300 border border-slate-700/50">
                      <Clock className="h-3.5 w-3.5 text-teal-400" />
                      <span>{formatDuration(service.duracionMinutos)}</span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">
                      {service.nombre}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed flex-1">
                      {service.descripcion}
                    </p>

                    {/* Precio y Acciones */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-slate-500 block">Inversión por sesión</span>
                        <span className="text-2xl font-black text-white">
                          {formatCurrency(service.precio)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Link href="/dashboard/servicios">
                            <Button size="sm" variant="secondary">Gestionar</Button>
                          </Link>
                        ) : (
                          <>
                        <CartControl servicio={service} />
                        <ReservarBoton servicio={service} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Por Qué FisioMarca (Propuesta de Valor) ──────────────────── */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              ¿Por qué elegir nuestro centro?
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              Nos enfocamos en la raíz del problema, no solo en mitigar los síntomas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950/60 relative group hover:border-teal-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Diagnóstico Clínico Preciso</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Evaluamos tu postura, rango articular y función miofascial antes de cualquier
                tratamiento para estructurar un plan 100% individualizado.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950/60 relative group hover:border-teal-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Terapia Manual & Tecnología</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Combinamos ventosas medicinales, vendaje neuromuscular, termoterapia y ejercicios
                correctivos basados en evidencia científica.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950/60 relative group hover:border-teal-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Seguimiento y Citas Online</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Agenda tus citas en segundos, añade múltiples sesiones a tu carrito y gestiona tu
                historial clínico desde tu panel personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Testimonios />

      {/* ─── CTA Final ─────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            ¿Listo para dar el primer paso hacia tu recuperación?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Agenda tu cita hoy mismo con nuestros especialistas y recibe un plan terapéutico a tu medida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href={agendarHref}>
              <Button size="lg" className="w-full sm:w-auto shadow-xl shadow-teal-500/30">
                <CalendarDays className="h-5 w-5 mr-2" />
                Agendar Mi Cita Ahora
              </Button>
            </Link>
            <Link href="/servicios">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700">
                Ver Todos los Servicios
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
