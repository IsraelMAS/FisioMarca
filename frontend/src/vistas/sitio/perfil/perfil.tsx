'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Shield, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/api/auth.service';
import { useAuth } from '@/lib/auth/context';
import { MiEvolucion } from '@/components/paciente/mi-evolucion';
import type { UserProfile } from '@/types';

export default function PerfilPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    authService
      .getProfile()
      .then((res) => {
        setProfile(res.data);
        setNombreCompleto(res.data.nombreCompleto || '');
        setTelefono(res.data.telefono || '');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar perfil');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await authService.updateProfile({
        nombreCompleto: nombreCompleto.trim(),
        telefono: telefono.trim(),
      });
      setProfile(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-400">Cargando datos del perfil...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center space-y-4">
        <User className="h-16 w-16 text-slate-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Inicia sesión para ver tu perfil</h2>
        <Link href="/login?redirect=/perfil">
          <Button className="mt-4">Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <Link href={isAdmin ? '/dashboard' : '/'} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        {isAdmin ? 'Volver al panel' : 'Volver al inicio'}
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
              {profile?.nombreCompleto?.charAt(0) || user?.nombre?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile?.nombreCompleto || user?.nombre}</h1>
              <p className="text-xs text-slate-400">{profile?.email}</p>
            </div>
          </div>
          <Badge variant="success">{isAdmin ? 'Administrador' : 'Paciente'}</Badge>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>¡Datos actualizados correctamente!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Correo Electrónico (No editable)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="999999999"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full mt-4 shadow-lg shadow-teal-500/20">
            {saving ? 'Guardando cambios...' : 'Actualizar Perfil'}
          </Button>
        </form>
      </div>

      {!isAdmin && user?.clienteId && <MiEvolucion clienteId={user.clienteId} />}
    </div>
  );
}
