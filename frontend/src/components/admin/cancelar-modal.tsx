'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { bookingService } from '@/lib/api/booking.service';
import { formatDateTime } from '@/lib/format';
import { nombresServicios } from '@/lib/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Modal, fieldClass } from '@/components/admin/ui';
import { useToast } from '@/components/admin/toast';
import type { Reserva } from '@/types';

const MOTIVOS = ['El paciente no puede asistir', 'Enfermedad', 'Reprogramará luego', 'Error al agendar', 'Otro'];

export function CancelarCitaModal({
  reserva,
  paciente,
  onClose,
  onCancelled,
}: {
  reserva: Reserva | null;
  paciente: string;
  onClose: () => void;
  onCancelled: (r: Reserva) => void;
}) {
  const toast = useToast();
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalle, setDetalle] = useState('');
  const [saving, setSaving] = useState(false);

  const confirmar = async () => {
    if (!reserva) return;
    setSaving(true);
    try {
      const texto = detalle.trim() ? `${motivo}: ${detalle.trim()}` : motivo;
      const res = await bookingService.cancel(reserva.id, texto);
      onCancelled(res.data);
      toast.success(`Cita #${reserva.id} cancelada`);
      setDetalle('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cancelar la cita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!reserva}
      onClose={onClose}
      title="Cancelar cita"
      description="El horario queda libre para otro paciente. No se puede deshacer."
      icon={XCircle}
    >
      {reserva && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
            <p className="font-medium text-white">{paciente}</p>
            <p className="mt-1 text-slate-400">{formatDateTime(reserva.fechaHoraInicio)}</p>
            <p className="mt-1 text-slate-500">{nombresServicios(reserva)}</p>
          </div>
          <Field label="Motivo">
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs transition-colors',
                    motivo === m
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-200'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Detalle (opcional)">
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              rows={2}
              maxLength={300}
              className={fieldClass}
              placeholder="Información adicional para el registro"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Volver
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmar} isLoading={saving}>
              Sí, cancelar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
