'use client';

import { useEffect } from 'react';
import { PaginaEstado } from '@/components/layout/pagina-estado';

// Captura cualquier excepción no controlada al renderizar una página
export default function ErrorPagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error de la aplicación:', error);
  }, [error]);

  return <PaginaEstado variante="error" onReintentar={reset} />;
}
