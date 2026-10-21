import type { Metadata } from 'next';
import { PaginaEstado } from '@/components/layout/pagina-estado';

export const metadata: Metadata = { title: 'Página no encontrada | FisioMarca' };

export default function NotFound() {
  return <PaginaEstado variante="404" />;
}
