'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  UserRound,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { bookingService } from '@/lib/api/booking.service';
import { toLocalISODate } from '@/lib/admin';
import { ThemeToggle } from '@/components/layout/theme-toggle';

type NavLink = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: boolean };

const navGroups: { label: string; links: NavLink[] }[] = [
  {
    label: 'General',
    links: [
      { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Agenda', href: '/dashboard/agenda', icon: CalendarRange },
    ],
  },
  {
    label: 'Clínica',
    links: [
      { label: 'Citas', href: '/dashboard/reservas', icon: CalendarDays, badge: true },
      { label: 'Historial clínico', href: '/dashboard/historial', icon: ClipboardList },
      { label: 'Transacciones', href: '/dashboard/transacciones', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Equipo',
    links: [
      { label: 'Fisioterapeutas y salas', href: '/dashboard/equipo', icon: UserRound },
      { label: 'Usuarios', href: '/dashboard/usuarios', icon: Users },
    ],
  },
  {
    label: 'Catálogo',
    links: [
      { label: 'Servicios', href: '/dashboard/servicios', icon: Stethoscope },
      { label: 'Categorías', href: '/dashboard/categorias', icon: FolderTree },
    ],
  },
  {
    label: 'Integraciones',
    links: [{ label: 'SOAP Explorer', href: '/dashboard/soap', icon: Terminal }],
  },
];

const allLinks = navGroups.flatMap((g) => g.links);

const noopSubscribe = () => () => {};

function fechaHoy() {
  const s = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Reloj de 24 h que avanza cada segundo (vacío durante el prerender)
const suscribirSegundos = (cb: () => void) => {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
};
const horaActual = () =>
  new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());

function Reloj() {
  const hora = useSyncExternalStore(suscribirSegundos, horaActual, () => '');
  if (!hora) return null;
  return (
    <span
      className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-xs tabular-nums text-teal-300"
      aria-label={`Hora actual ${hora}`}
      role="timer"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
      {hora}
    </span>
  );
}

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}

// ─── Shell ───────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // La fecha solo se calcula en el navegador (el shell se prerenderiza en el build)
  const today = useSyncExternalStore(noopSubscribe, fechaHoy, () => '');
  const [pendientesHoy, setPendientesHoy] = useState(0);

  // Contador del sidebar: citas de hoy aún no despachadas
  useEffect(() => {
    let cancel = false;
    bookingService
      .listAll()
      .then((res) => {
        if (cancel) return;
        const hoy = toLocalISODate(new Date());
        setPendientesHoy(
          (res.data ?? []).filter(
            (r) => r.fechaHoraInicio.startsWith(hoy) && (r.estado === 'PROGRAMADA' || r.estado === 'EN_ATENCION')
          ).length
        );
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [pathname]);

  const current = allLinks.find((l) => isActive(pathname, l.href));

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800/70 bg-slate-950 lg:flex">
        <SidebarContent pathname={pathname} badge={pendientesHoy} />
      </aside>

      {/* Sidebar móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent pathname={pathname} badge={pendientesHoy} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-800/70 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-500 sm:inline">Admin</span>
            <span className="hidden text-slate-700 sm:inline">/</span>
            <span className="truncate font-medium text-white">{current?.label ?? 'Panel'}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 md:inline">{today}</span>
            <Reloj />
            <ThemeToggle className="h-8 w-8" />
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver sitio</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

// ─── Contenido del sidebar (compartido escritorio/móvil) ────────────

function SidebarContent({ pathname, badge, onNavigate }: { pathname: string; badge: number; onNavigate?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link href="/dashboard" className="flex h-16 items-center gap-3 border-b border-slate-800/70 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
          <Stethoscope className="h-[18px] w-[18px] text-white" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">FisioMarca</p>
          <p className="text-[11px] text-slate-500">Panel clínico</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = isActive(pathname, link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      active ? 'bg-slate-800/70 font-medium text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    )}
                  >
                    {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-teal-400" />}
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span className="flex-1 truncate">{link.label}</span>
                    {link.badge && badge > 0 && (
                      <span className="rounded-md bg-teal-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-teal-300">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/70 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-semibold text-white">
            {user?.nombre?.charAt(0).toUpperCase() ?? 'A'}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-white">{user?.nombre ?? 'Administrador'}</p>
            <p className="text-[11px] text-slate-500">Administrador</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
