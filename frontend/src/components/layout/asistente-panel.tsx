'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, Stethoscope, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCIONES_INICIO, PASOS, respuestaLocal, type Accion } from '@/lib/asistente';

// ─── Panel del asistente (se descarga solo al abrir el chat) ─────────
// · Botones rápidos: se responden en el navegador, al instante y sin red.
// · Texto libre: /api/chat (IA). Si en 2,5 s no llega nada se ofrecen los
//   botones; si a los 20 s sigue sin llegar, contesta el modo local.

const ESPERA_BOTONES_MS = 2500;
const ESPERA_MAXIMA_MS = 20000;

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
  acciones?: Accion[];
}

const BIENVENIDA: Mensaje = {
  role: 'assistant',
  content: '¡Hola! Soy Marca, el asistente de FisioMarca. Cuéntame qué molestia tienes o elige una opción:',
  acciones: ACCIONES_INICIO,
};

// **negritas** y saltos de línea, sin interpretar HTML
function Texto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n').map((linea, i) => (
        <span key={i} className="block min-h-[0.5em]">
          {linea.split(/(\*\*[^*]+\*\*)/g).map((parte, j) =>
            parte.startsWith('**') && parte.endsWith('**') ? <strong key={j}>{parte.slice(2, -2)}</strong> : parte
          )}
        </span>
      ))}
    </>
  );
}

function Botones({ acciones, onElegir, onNavegar }: { acciones: Accion[]; onElegir: (a: Accion) => void; onNavegar: () => void }) {
  const estilo =
    'rounded-full border border-teal-500/30 bg-teal-500/5 px-3 py-1 text-left text-xs text-teal-200 transition-colors hover:bg-teal-500/15';
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {acciones.map((a) =>
        a.href ? (
          <Link key={a.etiqueta} href={a.href} onClick={onNavegar} className={estilo}>
            {a.etiqueta} →
          </Link>
        ) : (
          <button key={a.etiqueta} type="button" onClick={() => onElegir(a)} className={estilo}>
            {a.etiqueta}
          </button>
        )
      )}
    </div>
  );
}

export default function AsistentePanel({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([BIENVENIDA]);
  const [entrada, setEntrada] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [lento, setLento] = useState(false);
  const final = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const peticion = useRef<AbortController | null>(null);

  // Al desmontar se corta la respuesta en curso (y el servidor deja de generarla)
  useEffect(() => () => peticion.current?.abort(), []);

  useEffect(() => {
    final.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, abierto, lento]);

  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [abierto, onCerrar]);

  // Botón rápido: respuesta local. Si la IA aún no respondía, se descarta.
  const elegir = (accion: Accion) => {
    const paso = accion.ir ? PASOS[accion.ir] : undefined;
    if (!paso) return;
    const enCurso = peticion.current;
    peticion.current = null;
    enCurso?.abort();
    setMensajes((prev) => [
      ...(enCurso ? prev.slice(0, -1) : prev),
      { role: 'user', content: accion.etiqueta },
      { role: 'assistant', content: paso.texto, acciones: paso.acciones },
    ]);
  };

  const enviar = async (texto: string) => {
    const pregunta = texto.trim();
    if (!pregunta || escribiendo) return;
    const historial: Mensaje[] = [...mensajes, { role: 'user', content: pregunta }];
    setMensajes([...historial, { role: 'assistant', content: '' }]);
    setEntrada('');
    setEscribiendo(true);

    const control = new AbortController();
    peticion.current = control;
    const avisoLento = setTimeout(() => setLento(true), ESPERA_BOTONES_MS);
    const limite = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);
    let acumulado = '';
    let cuadro = 0;
    // Un render por cuadro de pantalla, no uno por fragmento recibido
    const pintar = () => {
      cuadro = 0;
      if (!control.signal.aborted) setMensajes([...historial, { role: 'assistant', content: acumulado }]);
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // La bienvenida es local y los botones no se envían al modelo
        body: JSON.stringify({ mensajes: historial.slice(1).map(({ role, content }) => ({ role, content })) }),
        signal: control.signal,
      });
      if (!res.body) throw new Error('sin respuesta');
      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        if (!acumulado) {
          clearTimeout(avisoLento);
          clearTimeout(limite);
          setLento(false);
        }
        acumulado += decoder.decode(value, { stream: true });
        if (!cuadro) cuadro = requestAnimationFrame(pintar);
      }
      cancelAnimationFrame(cuadro);
      if (!acumulado) acumulado = respuestaLocal(pregunta);
      pintar();
    } catch {
      cancelAnimationFrame(cuadro);
      if (peticion.current !== control) return; // se eligió un botón rápido
      setMensajes([
        ...historial,
        { role: 'assistant', content: acumulado || respuestaLocal(pregunta), acciones: ACCIONES_INICIO },
      ]);
    } finally {
      clearTimeout(avisoLento);
      clearTimeout(limite);
      if (peticion.current === control) peticion.current = null;
      setEscribiendo(false);
      setLento(false);
    }
  };

  const ultimo = mensajes.length - 1;

  return (
    <AnimatePresence>
      {abierto && (
        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto flex h-[min(560px,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
          role="dialog"
          aria-label="Asistente virtual de FisioMarca"
        >
          <header className="flex items-center gap-3 border-b border-slate-800 bg-gradient-to-r from-teal-500/15 to-emerald-500/5 px-4 py-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950">
              <Stethoscope className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Marca · Asistente IA</p>
              <p className="text-[11px] text-slate-400">Orientación sobre tratamientos y reservas</p>
            </div>
            <button onClick={onCerrar} aria-label="Cerrar asistente" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      m.role === 'user' ? 'rounded-br-md bg-teal-500 text-slate-950' : 'rounded-bl-md bg-slate-800/80 text-slate-100'
                    )}
                  >
                    {m.content ? (
                      <Texto texto={m.content} />
                    ) : (
                      <span className="flex gap-1 py-1" aria-label="Escribiendo">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 150}ms` }} />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                {i === ultimo && m.acciones && !escribiendo && <Botones acciones={m.acciones} onElegir={elegir} onNavegar={onCerrar} />}
              </div>
            ))}
            {escribiendo && lento && (
              <div className="space-y-1">
                <p className="text-[11px] text-slate-500">Mientras preparo la respuesta, puedes elegir:</p>
                <Botones acciones={ACCIONES_INICIO} onElegir={elegir} onNavegar={onCerrar} />
              </div>
            )}
            <div ref={final} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
            className="border-t border-slate-800 p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-1.5 focus-within:border-teal-500/60">
              <textarea
                ref={campo}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value.slice(0, 700))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviar(entrada);
                  }
                }}
                rows={1}
                placeholder="Escribe tu consulta…"
                aria-label="Tu consulta"
                className="max-h-24 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!entrada.trim() || escribiendo}
                aria-label="Enviar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-slate-950 transition-opacity disabled:opacity-30"
              >
                {escribiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">Orientación general con IA · no reemplaza una consulta médica</p>
          </form>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
