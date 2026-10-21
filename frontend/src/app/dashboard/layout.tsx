import { AdminGate } from '@/components/admin/admin-gate';

// ─── Layout del panel admin ──────────────────────────────────────────
// La sesión vive en localStorage, así que el rol se valida en el navegador.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
