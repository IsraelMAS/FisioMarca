'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { bookingService } from '@/lib/api/booking.service';
import { authService } from '@/lib/api/auth.service';
import { toLocalISODate } from '@/lib/admin';
import type { AdminUser, Fisioterapeuta, Reserva, Sala } from '@/types';

const noopSubscribe = () => () => {};
const hoySnapshot = () => toLocalISODate(new Date());

// Fecha local YYYY-MM-DD; '' durante el prerender (evita leer la hora en el servidor)
export function useHoy(): string {
  return useSyncExternalStore(noopSubscribe, hoySnapshot, () => '');
}

// Datos base del panel: reservas, pacientes, fisioterapeutas y salas
export function useClinica({ incluirExpiradas = false }: { incluirExpiradas?: boolean } = {}) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [fisios, setFisios] = useState<Fisioterapeuta[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, u, f, s] = await Promise.allSettled([
      bookingService.listAll(),
      authService.listUsers(),
      bookingService.listTherapists(),
      bookingService.listRooms(),
    ]);
    setError(null);
    // Las compras abandonadas (EXPIRADA) no ocupan horario: solo se muestran donde se piden
    if (r.status === 'fulfilled')
      setReservas((r.value.data ?? []).filter((x) => incluirExpiradas || x.estado !== 'EXPIRADA'));
    else setError(r.reason instanceof Error ? r.reason.message : '');
    if (u.status === 'fulfilled') setUsuarios(u.value.data ?? []);
    if (f.status === 'fulfilled') setFisios(f.value.data ?? []);
    if (s.status === 'fulfilled') setSalas(s.value.data ?? []);
    setLoading(false);
  }, [incluirExpiradas]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  const mapas = useMemo(() => {
    const clientes: Record<number, AdminUser> = {};
    usuarios.forEach((u) => u.clienteId && (clientes[u.clienteId] = u));
    const fisio: Record<number, Fisioterapeuta> = {};
    fisios.forEach((f) => (fisio[f.id] = f));
    const sala: Record<number, Sala> = {};
    salas.forEach((s) => (sala[s.id] = s));
    return { clientes, fisio, sala };
  }, [usuarios, fisios, salas]);

  const pacientes = useMemo(() => usuarios.filter((u) => u.clienteId), [usuarios]);

  const nombrePaciente = useCallback(
    (clienteId: number) => mapas.clientes[clienteId]?.nombreCompleto ?? `Paciente #${clienteId}`,
    [mapas]
  );

  // Reemplaza una reserva tras una acción (check-in, cancelar, reasignar…)
  const upsertReserva = useCallback((r: Reserva) => {
    setReservas((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [...prev, r]));
  }, []);

  return {
    reservas,
    usuarios,
    pacientes,
    fisios,
    salas,
    setFisios,
    setSalas,
    ...mapas,
    nombrePaciente,
    upsertReserva,
    loading,
    error,
    refresh,
  };
}

export type Clinica = ReturnType<typeof useClinica>;
