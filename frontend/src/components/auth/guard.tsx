'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

type Rol = 'ADMINISTRADOR' | 'CLIENTE';

// Segunda capa de protección (la primera es el proxy del servidor).
// Mientras la sesión se restaura se muestra la página con sus skeletons;
// si al final no corresponde, se reemplaza la URL sin dejarla en el historial.
export function useRolPermitido(rol?: Rol) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const permitido = isAuthenticated && (!rol || (rol === 'ADMINISTRADOR') === isAdmin);

  useEffect(() => {
    if (isLoading || permitido) return;
    if (!isAuthenticated) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    else router.replace(isAdmin ? '/dashboard' : '/');
  }, [isLoading, permitido, isAuthenticated, isAdmin, pathname, router]);

  return { listo: isLoading || permitido };
}

export function Guard({ rol, children }: { rol?: Rol; children: React.ReactNode }) {
  const { listo } = useRolPermitido(rol);
  if (!listo) return <Redirigiendo />;
  return <>{children}</>;
}

export function Redirigiendo() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center gap-2 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
      Redirigiendo…
    </div>
  );
}
