'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

// ─── Botones flotantes: asistente IA + WhatsApp ──────────────────────
// Aquí solo viven los dos botones. El panel del chat (mensajes, respuestas
// rápidas, streaming) es un chunk aparte que se descarga al abrirlo
// (o antes, al pasar el mouse por el botón), así no pesa en cada página.

const WHATSAPP = '51926021752';
const MENSAJE_WHATSAPP = 'Hola FisioMarca, quisiera información sobre sus tratamientos de fisioterapia.';

const AsistentePanel = dynamic(() => import('./asistente-panel'), { ssr: false });
const precargarPanel = () => void import('./asistente-panel');

export function AsistenteFlotante() {
  const [abierto, setAbierto] = useState(false);
  // Se monta al primer uso y luego se mantiene: la conversación sobrevive al cerrar
  const [usado, setUsado] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 [padding-bottom:env(safe-area-inset-bottom)]">
      {usado && <AsistentePanel abierto={abierto} onCerrar={cerrar} />}

      <div className="pointer-events-auto flex items-center gap-3">
        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MENSAJE_WHATSAPP)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escríbenos por WhatsApp"
          title="Escríbenos por WhatsApp"
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition-transform hover:scale-110"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36A9.43 9.43 0 0 1 2.6 12.06c0-5.2 4.24-9.44 9.46-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.77 6.68c0 5.21-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.79.7.69 5.8.69 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.03-1.58a11.33 11.33 0 0 0 5.42 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03" />
          </svg>
        </a>
        <button
          onClick={() => {
            setUsado(true);
            setAbierto(!abierto);
          }}
          onPointerEnter={precargarPanel}
          onFocus={precargarPanel}
          aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente con IA'}
          aria-expanded={abierto}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-600 text-slate-950 shadow-xl shadow-teal-500/30 transition-transform hover:scale-105"
        >
          {!abierto && <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/30 [animation-duration:2.5s]" aria-hidden="true" />}
          {abierto ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
