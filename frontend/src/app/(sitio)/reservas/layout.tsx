import { Suspense } from 'react';
import { Guard, Redirigiendo } from '@/components/auth/guard';

// Suspense: el guard lee la URL (usePathname) y las rutas dinámicas lo exigen en Next 16
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Redirigiendo />}>
      <Guard rol="CLIENTE">{children}</Guard>
    </Suspense>
  );
}
