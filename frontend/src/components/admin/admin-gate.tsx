'use client';

import { AdminShell } from '@/components/admin/admin-shell';
import { Redirigiendo, useRolPermitido } from '@/components/auth/guard';

// ─── Guard del panel admin ───────────────────────────────────────────
// El proxy ya exige token con rol ADMINISTRADOR; esto es la segunda capa.
// Mientras la sesión se restaura (y en el prerender) se muestra el panel
// con sus skeletons; los datos igual los protege el backend por rol.

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { listo } = useRolPermitido('ADMINISTRADOR');

  if (!listo) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Redirigiendo />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
