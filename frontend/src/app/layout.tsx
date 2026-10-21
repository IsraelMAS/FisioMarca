import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { ToastProvider } from '@/components/admin/toast';
import { CartProvider } from '@/components/cart/cart-context';
import { SCRIPT_TEMA } from '@/lib/tema';
import { Stethoscope } from 'lucide-react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FisioMarca | Fisioterapia, Rehabilitación y Bienestar Integral',
  description:
    'Centro especializado en fisioterapia, rehabilitación neurológica y postoperatoria, recuperación muscular y masajes terapéuticos.',
  keywords: [
    'fisioterapia',
    'rehabilitación',
    'postoperatorio',
    'lumbalgia',
    'cervicalgia',
    'masaje terapéutico',
    'bienestar',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        {/* Tema guardado (claro/oscuro) antes de pintar, sin parpadeo */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        {/* El splash solo se muestra en la primera carga de la sesión del navegador */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('fm_splash'))document.documentElement.classList.add('sin-splash');else sessionStorage.setItem('fm_splash','1')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
        <div className="splash" aria-hidden="true">
          <div className="splash-logo">
            <Stethoscope className="h-9 w-9 text-white" />
          </div>
          <p className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            FisioMarca
          </p>
          <div className="splash-barra" />
        </div>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
