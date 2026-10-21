'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Pencil, Plus, RefreshCw, Stethoscope } from 'lucide-react';
import { catalogService } from '@/lib/api/catalog.service';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/toast';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  SkeletonRows,
  Table,
  Td,
  Th,
  fieldClass,
} from '@/components/admin/ui';
import type { Categoria, Servicio, ServicioCreateRequest } from '@/types';

type Filtro = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

const EMPTY_FORM: ServicioCreateRequest = {
  nombre: '',
  descripcion: '',
  precio: 60,
  duracionMinutos: 45,
  imagenUrl: '',
  activo: true,
  categoriaId: 0,
};

export default function AdminServiciosPage() {
  const toast = useToast();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number>(0);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState<ServicioCreateRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [srv, cats] = await Promise.allSettled([catalogService.getAllServices(), catalogService.getCategories()]);
    setError(null);
    if (srv.status === 'fulfilled') setServicios(srv.value.data ?? []);
    else setError(srv.reason instanceof Error ? srv.reason.message : '');
    if (cats.status === 'fulfilled') setCategorias(cats.value.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const counts = useMemo(() => {
    const activos = servicios.filter((s) => s.activo).length;
    return { TODOS: servicios.length, ACTIVOS: activos, INACTIVOS: servicios.length - activos };
  }, [servicios]);

  const filtered = servicios.filter((s) => {
    if (filtro === 'ACTIVOS' && !s.activo) return false;
    if (filtro === 'INACTIVOS' && s.activo) return false;
    if (categoriaFiltro && s.categoriaId !== categoriaFiltro) return false;
    const q = search.trim().toLowerCase();
    return !q || s.nombre.toLowerCase().includes(q) || s.descripcion?.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoriaId: categorias[0]?.id ?? 0 });
    setModalOpen(true);
  };

  const openEdit = (s: Servicio) => {
    setEditing(s);
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      precio: Number(s.precio),
      duracionMinutos: s.duracionMinutos,
      imagenUrl: s.imagenUrl ?? '',
      activo: s.activo,
      categoriaId: s.categoriaId,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!form.categoriaId) {
      toast.error('Selecciona una categoría');
      return;
    }
    setSubmitting(true);
    const body = { ...form, imagenUrl: form.imagenUrl?.trim() || null };
    try {
      if (editing) {
        const res = await catalogService.updateService({ ...editing, ...body });
        setServicios((prev) => prev.map((s) => (s.id === editing.id ? res.data : s)));
        toast.success('Servicio actualizado');
      } else {
        const res = await catalogService.createService(body);
        setServicios((prev) => [res.data, ...prev]);
        toast.success('Servicio creado');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (s: Servicio) => {
    setTogglingId(s.id);
    try {
      await catalogService.toggleServiceStatus(s.id, !s.activo);
      setServicios((prev) => prev.map((x) => (x.id === s.id ? { ...x, activo: !s.activo } : x)));
      toast.success(`${s.nombre} ${s.activo ? 'desactivado' : 'activado'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Tratamientos, tarifas y disponibilidad del catálogo."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} aria-label="Actualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo servicio
            </Button>
          </>
        }
      />

      {error !== null && <ErrorBanner service="Micro-Catalogo" message={error} onRetry={refresh} />}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Segmented
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: 'TODOS', label: 'Todos', count: counts.TODOS },
              { value: 'ACTIVOS', label: 'Activos', count: counts.ACTIVOS },
              { value: 'INACTIVOS', label: 'Inactivos', count: counts.INACTIVOS },
            ]}
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(Number(e.target.value))}
            className={cn(fieldClass, 'h-10 py-0 sm:w-56')}
            aria-label="Filtrar por categoría"
          >
            <option value={0}>Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar tratamiento" />
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Tratamiento</Th>
            <Th>Categoría</Th>
            <Th className="text-right">Precio</Th>
            <Th>Duración</Th>
            <Th>Disponible</Th>
            <Th className="text-right">
              <span className="sr-only">Acciones</span>
            </Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {loading ? (
            <SkeletonRows cols={6} />
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={Stethoscope}
                  title={servicios.length === 0 ? 'El catálogo está vacío' : 'Sin resultados'}
                  action={
                    servicios.length === 0 ? (
                      <Button size="sm" onClick={openCreate}>
                        Crear el primero
                      </Button>
                    ) : undefined
                  }
                />
              </td>
            </tr>
          ) : (
            filtered.map((s) => (
              <tr key={s.id} className={cn('transition-colors hover:bg-slate-800/20', !s.activo && 'opacity-60')}>
                <Td>
                  <div className="flex items-center gap-3">
                    {s.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imagenUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-slate-800 object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
                        <Stethoscope className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{s.nombre}</p>
                      <p className="max-w-xs truncate text-xs text-slate-500">{s.descripcion}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="whitespace-nowrap rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300">
                    {s.categoriaNombre || categorias.find((c) => c.id === s.categoriaId)?.nombre || `#${s.categoriaId}`}
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-right font-medium tabular-nums text-white">
                  {formatCurrency(Number(s.precio))}
                </Td>
                <Td className="whitespace-nowrap text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(s.duracionMinutos)}
                  </span>
                </Td>
                <Td>
                  <Switch checked={s.activo} disabled={togglingId === s.id} onChange={() => handleToggle(s)} label={s.nombre} />
                </Td>
                <Td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar servicio' : 'Nuevo servicio'}
        description={editing ? `Modificando #${editing.id}` : 'Se publicará en el catálogo del sitio.'}
        icon={Stethoscope}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre">
            <input
              required
              maxLength={120}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Terapia miofascial"
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción" hint={`${form.descripcion.length}/255`}>
            <textarea
              rows={3}
              maxLength={255}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Beneficios y en qué consiste la sesión"
              className={cn(fieldClass, 'resize-none')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio (S/)">
              <input
                type="number"
                required
                min={0.5}
                step={0.5}
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                className={fieldClass}
              />
            </Field>
            <Field label="Duración (min)">
              <input
                type="number"
                required
                min={1}
                value={form.duracionMinutos}
                onChange={(e) => setForm({ ...form, duracionMinutos: Number(e.target.value) })}
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="Categoría">
            <select
              required
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: Number(e.target.value) })}
              className={fieldClass}
            >
              <option value={0} disabled>
                Selecciona una categoría
              </option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL de imagen" hint="Opcional. Ej. /images/services/masaje.jpeg">
            <input
              value={form.imagenUrl ?? ''}
              onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
              placeholder="/images/services/..."
              className={fieldClass}
            />
          </Field>
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
            <span className="text-sm text-slate-300">Disponible para reservar</span>
            <Switch checked={form.activo} onChange={() => setForm({ ...form, activo: !form.activo })} label="Disponible" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {editing ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-teal-500' : 'bg-slate-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
