'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { CartDropdown } from '@/components/cart/cart-dropdown';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-shadow duration-300">
              <Stethoscope className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              FisioMarca
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Inicio</NavLink>
            <NavLink href="/servicios">Servicios</NavLink>
            <NavLink href="/categorias">Categorías</NavLink>
            {isAuthenticated && !isAdmin && (
              <NavLink href="/reservas">
                <CalendarDays className="h-4 w-4" />
                Mis Citas
              </NavLink>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-teal-400" />
                    Panel Admin
                  </Link>
                )}
                {!isAdmin && <CartDropdown />}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/80 transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white">
                      {user?.nombre?.charAt(0) ?? 'U'}
                    </div>
                    <span className="max-w-[120px] truncate">{user?.nombre}</span>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl p-2 shadow-xl"
                      >
                        <div className="px-3 py-2 border-b border-slate-800 mb-1">
                          <p className="text-sm font-medium text-white">{user?.nombre}</p>
                          <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Paciente'}</p>
                        </div>
                        <DropdownLink href="/perfil" icon={<User className="h-4 w-4" />} onClick={() => setProfileOpen(false)}>
                          Mi Perfil
                        </DropdownLink>
                        {isAdmin && (
                          <DropdownLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setProfileOpen(false)}>
                            Dashboard
                          </DropdownLink>
                        )}
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Iniciar sesión</Button>
                </Link>
                <Link href="/registro">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          {/* Móvil: carrito + menú */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            {isAuthenticated && !isAdmin && <CartDropdown />}
            <button
              className="p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="space-y-1 px-4 py-4">
              <MobileLink href="/" onClick={() => setMobileOpen(false)}>Inicio</MobileLink>
              <MobileLink href="/servicios" onClick={() => setMobileOpen(false)}>Servicios</MobileLink>
              <MobileLink href="/categorias" onClick={() => setMobileOpen(false)}>Categorías</MobileLink>
              {isAuthenticated && (
                <>
                  {!isAdmin && (
                    <>
                      <MobileLink href="/reservas" onClick={() => setMobileOpen(false)}>Mis Citas</MobileLink>
                      <MobileLink href="/carrito" onClick={() => setMobileOpen(false)}>Carrito</MobileLink>
                    </>
                  )}
                  <MobileLink href="/perfil" onClick={() => setMobileOpen(false)}>Mi Perfil</MobileLink>
                  {isAdmin && <MobileLink href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>}
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm">
                    Cerrar sesión
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <div className="flex gap-3 pt-3">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">Iniciar sesión</Button>
                  </Link>
                  <Link href="/registro" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full" size="sm">Registrarse</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
      {children}
    </Link>
  );
}

function DropdownLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
      {icon}
      {children}
    </Link>
  );
}
