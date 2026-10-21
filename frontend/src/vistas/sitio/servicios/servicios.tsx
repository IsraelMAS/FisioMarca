'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Clock, ShoppingCart, CheckCircle2, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDuration } from '@/lib/format';
import { catalogService } from '@/lib/api/catalog.service';
import { CartControl, ReservarBoton } from '@/components/cart/cart-control';
import { useAuth } from '@/lib/auth/context';
import type { Servicio, Categoria } from '@/types';

const DEMO_CATEGORIES: Categoria[] = [
  { id: 0, nombre: 'Todos', descripcion: 'Todos los tratamientos', imagenUrl: null, activo: true },
  { id: 1, nombre: 'Postoperatorio', descripcion: 'Recuperación quirúrgica', imagenUrl: null, activo: true },
  { id: 2, nombre: 'Neurología Funcional', descripcion: 'Rehabilitación neuromotora', imagenUrl: null, activo: true },
  { id: 3, nombre: 'Músculo y Articular', descripcion: 'Dolores y contracturas', imagenUrl: null, activo: true },
  { id: 4, nombre: 'Técnicas Manuales', descripcion: 'Masajes y descargas', imagenUrl: null, activo: true },
  { id: 5, nombre: 'Bienestar Integral', descripcion: 'Prevención y calor', imagenUrl: null, activo: true },
];

const DEMO_SERVICES: Servicio[] = [
  { id: 1, nombre: 'Post operatorio', descripcion: 'Fisioterapia especializada post cirugía para reducir inflamación y recuperar rango motriz de forma segura.', precio: 80, duracionMinutos: 60, imagenUrl: '/images/services/post-operatorio.jpeg', activo: true, categoriaId: 1, categoriaNombre: 'Postoperatorio' },
  { id: 2, nombre: 'Parálisis facial', descripcion: 'Estimulación neuromuscular dirigida, reeducación del tono muscular y ejercicios de mímica facial.', precio: 70, duracionMinutos: 50, imagenUrl: '/images/services/paralisis-facial.jpeg', activo: true, categoriaId: 2, categoriaNombre: 'Neurología Funcional' },
  { id: 3, nombre: 'Desgarros musculares', descripcion: 'Protocolo de cicatrización tisular, regeneración de fibras y reacondicionamiento funcional progresivo.', precio: 65, duracionMinutos: 50, imagenUrl: '/images/services/desgarros.jpeg', activo: true, categoriaId: 3, categoriaNombre: 'Músculo y Articular' },
  { id: 4, nombre: 'Lumbalgia', descripcion: 'Alivio inmediato de dolor en zona baja de espalda, descompresión postural y fortalecimiento lumbar.', precio: 55, duracionMinutos: 45, imagenUrl: '/images/services/lumbalgia.jpeg', activo: true, categoriaId: 3, categoriaNombre: 'Músculo y Articular' },
  { id: 5, nombre: 'Piedras calientes', descripcion: 'Termoterapia natural que disuelve contracturas profundas, mejora la irrigación y equilibra el estrés.', precio: 50, duracionMinutos: 45, imagenUrl: '/images/services/piedras-calientes.jpeg', activo: true, categoriaId: 5, categoriaNombre: 'Bienestar Integral' },
  { id: 6, nombre: 'Cervicalgia', descripcion: 'Tratamiento focalizado para dolor cervical, tensión de cuello, hombros y dolor de cabeza tensional.', precio: 55, duracionMinutos: 45, imagenUrl: '/images/services/cervicalgia.jpeg', activo: true, categoriaId: 3, categoriaNombre: 'Músculo y Articular' },
  { id: 7, nombre: 'ACV (Rehabilitación)', descripcion: 'Recuperación integral neuromotora, marcha, equilibrio e independencia motora con terapeutas calificados.', precio: 90, duracionMinutos: 60, imagenUrl: '/images/services/acv.jpeg', activo: true, categoriaId: 2, categoriaNombre: 'Neurología Funcional' },
  { id: 8, nombre: 'Lesión de ligamentos', descripcion: 'Fortalecimiento, estabilidad ligamentosa y propiocepción para ligamentos cruzados, colaterales y tobillos.', precio: 75, duracionMinutos: 55, imagenUrl: '/images/services/ligamentos.jpeg', activo: true, categoriaId: 3, categoriaNombre: 'Músculo y Articular' },
  { id: 9, nombre: 'Masaje reductor', descripcion: 'Masaje mecánico focalizado y drenaje para activar el retorno linfático y reducir medidas corporales.', precio: 45, duracionMinutos: 40, imagenUrl: '/images/services/masaje-reductor.jpeg', activo: true, categoriaId: 4, categoriaNombre: 'Técnicas Manuales' },
  { id: 10, nombre: 'Ventosas (Cupping)', descripcion: 'Terapia descompresiva de vacío que libera miofascia, elimina toxinas y acelera la recuperación tisular.', precio: 40, duracionMinutos: 35, imagenUrl: '/images/services/ventosas.jpeg', activo: true, categoriaId: 5, categoriaNombre: 'Bienestar Integral' },
  { id: 11, nombre: 'Vendaje neuromuscular', descripcion: 'Aplicación experta de Kinesiotape para inhibición o activación muscular, analgesia y soporte continuo.', precio: 35, duracionMinutos: 30, imagenUrl: '/images/services/vendaje-neuromuscular.jpeg', activo: true, categoriaId: 3, categoriaNombre: 'Músculo y Articular' },
  { id: 12, nombre: 'Masaje relajante', descripcion: 'Sesión antiestrés para liberar endorfinas, relajar el sistema nervioso central y reducir el insomnio.', precio: 40, duracionMinutos: 40, imagenUrl: '/images/services/relajante.jpeg', activo: true, categoriaId: 4, categoriaNombre: 'Técnicas Manuales' },
  { id: 13, nombre: 'Masaje descontracturante', descripcion: 'Presión media-alta para deshacer nódulos miofasciales dolorosos y recuperar la elasticidad perdida.', precio: 45, duracionMinutos: 45, imagenUrl: '/images/services/descontracturante.jpeg', activo: true, categoriaId: 4, categoriaNombre: 'Técnicas Manuales' },
  { id: 14, nombre: 'Descarga muscular', descripcion: 'Especial para atletas y personas con sobrecarga deportiva: drena ácido láctico y previene lesiones.', precio: 50, duracionMinutos: 45, imagenUrl: '/images/services/descarga-muscular.jpeg', activo: true, categoriaId: 4, categoriaNombre: 'Técnicas Manuales' },
];

export default function ServiciosPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [services, setServices] = useState<Servicio[]>(DEMO_SERVICES);
  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    catalogService
      .getActiveServices()
      .then((res) => {
        if (res.data && res.data.length > 0) setServices(res.data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCat === 0 || s.categoriaId === selectedCat;
      const matchSearch =
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCat, searchTerm]);


  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-3">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <h1 className="text-3xl font-extrabold text-white">Catálogo Completo de Terapias</h1>
          <p className="text-slate-400 mt-1 text-sm">Explora nuestras 14 especialidades en fisioterapia y rehabilitación</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-sm text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {DEMO_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCat === c.id
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <div
            key={service.id}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-teal-500/40 transition-all flex flex-col"
          >
            <div className="relative h-48 w-full bg-slate-800">
              {service.imagenUrl ? (
                <Image
                  src={service.imagenUrl}
                  alt={service.nombre}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600">
                  <Activity className="h-10 w-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-xs text-slate-300">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                <span>{formatDuration(service.duracionMinutos)}</span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">
                  {service.nombre}
                </h3>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">{service.descripcion}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Sesión</span>
                  <span className="text-2xl font-bold text-white">{formatCurrency(service.precio)}</span>
                </div>

                <div className="flex gap-2">
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
    </div>
  );
}
