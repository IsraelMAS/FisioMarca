import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AsistenteFlotante } from '@/components/layout/asistente-flotante';

// ─── Sitio público y del paciente ────────────────────────────────────
// Grupo de rutas "(sitio)": comparte Navbar + Footer sin cambiar las URLs.
// El panel /dashboard tiene su propio layout a pantalla completa.
export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col pt-16">{children}</main>
      <Footer />
      <AsistenteFlotante />
    </>
  );
}
