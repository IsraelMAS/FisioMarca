'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const TESTIMONIOS = [
  {
    nombre: 'Carlos Mendoza',
    tratamiento: 'Rehabilitación de Lumbalgia',
    comentario:
      'Llegué prácticamente sin poder doblar la espalda por una hernia lumbar. En 6 sesiones con los masajes descontracturantes y terapia física recuperé mi calidad de vida.',
  },
  {
    nombre: 'Valeria Quispe',
    tratamiento: 'Postoperatorio de Rodilla (LCA)',
    comentario:
      'Excelente profesionalismo. La atención es de primera, el protocolo de recuperación de ligamentos me permitió volver a correr sin molestias.',
  },
  {
    nombre: 'Mariana Flores',
    tratamiento: 'Parálisis Facial',
    comentario:
      'La paciencia y técnica de los fisioterapeutas fue clave para mi recuperación facial en tiempo récord. Recomiendo totalmente a FisioMarca.',
  },
  {
    nombre: 'Jorge Castillo',
    tratamiento: 'Cervicalgia',
    comentario:
      'Trabajo muchas horas frente a la computadora y el dolor de cuello ya no me dejaba dormir. Con la terapia y los ejercicios que me dejaron para casa, hoy trabajo sin dolor.',
  },
  {
    nombre: 'Rosa Huamán',
    tratamiento: 'Rehabilitación post ACV',
    comentario:
      'Acompañaron a mi papá con muchísimo cariño después de su ACV. Recuperó la movilidad de su brazo y volvió a caminar con seguridad. Eternamente agradecidos.',
  },
  {
    nombre: 'Diego Rojas',
    tratamiento: 'Esguince de Tobillo',
    comentario:
      'Me lesioné jugando fútbol y pensé que estaría meses parado. En tres semanas ya estaba entrenando de nuevo, con un plan de fortalecimiento muy bien guiado.',
  },
  {
    nombre: 'Fiorella Ramos',
    tratamiento: 'Vendaje Neuromuscular',
    comentario:
      'El vendaje me dio estabilidad desde el primer día y pude seguir con mis clases de danza mientras me recuperaba. Atención puntual y muy profesional.',
  },
  {
    nombre: 'Andrés Villanueva',
    tratamiento: 'Evaluación Postural',
    comentario:
      'La evaluación postural me abrió los ojos: tenía una escoliosis leve que nadie había detectado. Ahora sigo un plan de ejercicios y mi espalda lo agradece.',
  },
  {
    nombre: 'Patricia Vega',
    tratamiento: 'Piedras Calientes',
    comentario:
      'Una experiencia de relajación total. Salí sin tensión en la espalda y con energía renovada. El ambiente de la clínica es tranquilo y muy limpio.',
  },
];

const INTERVALO = 6000;

const suscribirMedia = (cb: () => void) => {
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

function useTarjetasPorVista() {
  return useSyncExternalStore(
    suscribirMedia,
    () => (window.matchMedia('(min-width: 1024px)').matches ? 3 : 1),
    () => 3
  );
}

export function Testimonios() {
  const porVista = useTarjetasPorVista();
  const paginas = Math.ceil(TESTIMONIOS.length / porVista);
  const [pagina, setPagina] = useState(0);
  const [pausa, setPausa] = useState(false);
  const actual = pagina % paginas;

  useEffect(() => {
    if (pausa) return;
    const t = setInterval(() => setPagina((p) => (p + 1) % paginas), INTERVALO);
    return () => clearInterval(t);
  }, [pausa, paginas]);

  const visibles = TESTIMONIOS.slice(actual * porVista, actual * porVista + porVista);
  const ir = (n: number) => setPagina((n + paginas) % paginas);

  return (
    <section className="relative overflow-hidden border-t border-slate-900 bg-slate-950 py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">Testimonios</span>
          <h2 className="mt-2 text-3xl font-bold text-white">Casos de Éxito de Nuestros Pacientes</h2>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Historias reales de personas que superaron sus lesiones y volvieron a su rutina.
          </p>
        </div>

        <div onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} className="relative">
          <div className="min-h-[300px] sm:min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${porVista}-${actual}`}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-3"
              >
                {visibles.map((t) => (
                  <article
                    key={t.nombre}
                    className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-teal-500/30"
                  >
                    <Quote className="absolute right-5 top-5 h-8 w-8 text-teal-500/10" />
                    <div>
                      <div className="mb-4 flex gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm italic leading-relaxed text-slate-300">&ldquo;{t.comentario}&rdquo;</p>
                    </div>
                    <div className="mt-6 flex items-center gap-3 border-t border-slate-800/80 pt-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-bold text-white">
                        {t.nombre
                          .split(' ')
                          .map((p) => p[0])
                          .join('')}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.nombre}</p>
                        <p className="mt-0.5 text-xs text-teal-400">{t.tratamiento}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => ir(actual - 1)}
              aria-label="Anteriores"
              className="rounded-full border border-slate-800 p-2 text-slate-400 transition-colors hover:border-teal-500/40 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: paginas }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => ir(i)}
                  aria-label={`Ir al grupo ${i + 1}`}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    i === actual ? 'w-8 bg-teal-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => ir(actual + 1)}
              aria-label="Siguientes"
              className="rounded-full border border-slate-800 p-2 text-slate-400 transition-colors hover:border-teal-500/40 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
