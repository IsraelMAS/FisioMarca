// ─── Tema claro / oscuro ─────────────────────────────────────────────
// El oscuro es el de siempre (clase "dark" en <html>). El claro solo
// cambia la clase a "light": globals.css remapea la paleta de Tailwind,
// así que ningún componente necesita variantes dark:/light:.

export type Tema = 'dark' | 'light';

const CLAVE = 'fm_tema';
const EVENTO = 'fm-tema';

// Se ejecuta en <head> antes de pintar, para que no parpadee el tema oscuro
export const SCRIPT_TEMA = `try{if(localStorage.getItem('${CLAVE}')==='light'){var c=document.documentElement.classList;c.remove('dark');c.add('light')}}catch(e){}`;

function aplicar(tema: Tema) {
  const clases = document.documentElement.classList;
  clases.toggle('light', tema === 'light');
  clases.toggle('dark', tema === 'dark');
  window.dispatchEvent(new Event(EVENTO));
}

export const leerTema = (): Tema => (document.documentElement.classList.contains('light') ? 'light' : 'dark');

export function cambiarTema(tema: Tema) {
  aplicar(tema);
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // modo privado sin almacenamiento: el tema dura hasta recargar
  }
}

// Avisa de cambios en esta pestaña y en las demás abiertas del sitio
export function suscribirTema(cb: () => void) {
  const otraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) aplicar(e.newValue === 'light' ? 'light' : 'dark');
  };
  window.addEventListener(EVENTO, cb);
  window.addEventListener('storage', otraPestana);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener('storage', otraPestana);
  };
}
