'use client';

import Link from 'next/link';
import { Stethoscope, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                FisioMarca
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Centro de fisioterapia especializado en rehabilitación y bienestar integral.
              Tu recuperación es nuestra prioridad.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Navegación</h4>
            <ul className="space-y-2">
              {[
                { label: 'Servicios', href: '/servicios' },
                { label: 'Categorías', href: '/categorias' },
                { label: 'Reservar Cita', href: '/reservas/nueva' },
                { label: 'Mi Perfil', href: '/perfil' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-500 hover:text-teal-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Servicios Populares</h4>
            <ul className="space-y-2">
              {['Rehabilitación Postoperatoria', 'Masaje Descontracturante', 'Terapia con Ventosas', 'Cervicalgia'].map(s => (
                <li key={s} className="text-sm text-slate-500">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <Phone className="h-4 w-4 text-teal-500" />
                +51 999 999 999
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <Mail className="h-4 w-4 text-teal-500" />
                contacto@fisiomarca.com
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-teal-500 mt-0.5" />
                Lima, Perú
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/50 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © 2026 FisioMarca. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistema operativo — Microservicios activos
          </div>
        </div>
      </div>
    </footer>
  );
}
