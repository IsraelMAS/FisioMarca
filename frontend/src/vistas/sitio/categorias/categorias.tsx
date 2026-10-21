'use client';

import Link from 'next/link';
import { Activity, ShieldCheck, HeartPulse, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  {
    id: 1,
    nombre: 'Rehabilitación Postoperatoria',
    descripcion: 'Protocolos de fisioterapia avanzada para pacientes después de intervenciones quirúrgicas traumatológicas y reconstructivas.',
    servicios: ['Post operatorio'],
    icon: Activity,
  },
  {
    id: 2,
    nombre: 'Neurología Funcional',
    descripcion: 'Tratamientos especializados para la rehabilitación de patologías del sistema nervioso central y periférico.',
    servicios: ['Parálisis facial', 'ACV (Rehabilitación)'],
    icon: Sparkles,
  },
  {
    id: 3,
    nombre: 'Recuperación Muscular y Articular',
    descripcion: 'Tratamiento integral y no invasivo para contracturas, desgarros fibrilares y sobrecargas biomecánicas.',
    servicios: ['Desgarros', 'Lumbalgia', 'Cervicalgia', 'Lesión de ligamentos', 'Vendaje neuromuscular'],
    icon: ShieldCheck,
  },
  {
    id: 4,
    nombre: 'Masajes y Técnicas Manuales',
    descripcion: 'Terapias manuales profundas diseñadas para aliviar tensiones crónicas y restablecer la movilidad fascial.',
    servicios: ['Masaje reductor', 'Relajante', 'Descontracturante', 'Descarga muscular'],
    icon: HeartPulse,
  },
  {
    id: 5,
    nombre: 'Prevención y Bienestar Integral',
    descripcion: 'Terapias complementarias para el equilibrio funcional, alivio del estrés y desintoxicación celular.',
    servicios: ['Piedras calientes', 'Ventosas (Cupping)'],
    icon: Sparkles,
  },
];

export default function CategoriasPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Especialidades Clínicas</h1>
        <p className="text-slate-400 mt-2 text-base">
          Descubre nuestras 5 áreas de especialización fisioterapéutica y los tratamientos correspondientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between hover:border-teal-500/40 transition-all"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{cat.nombre}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{cat.descripcion}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                    Tratamientos incluidos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.servicios.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <Link href={`/servicios`}>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    Ver Tratamientos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
