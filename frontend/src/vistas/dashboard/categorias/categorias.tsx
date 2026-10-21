'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderTree, Pencil, Plus, RefreshCw, Stethoscope } from 'lucide-react';
import { catalogService } from '@/lib/api/catalog.service';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/toast';
import { EmptyState, ErrorBanner, Field, Modal, PageHeader, fieldClass } from '@/components/admin/ui';
import type { Categoria, CategoriaCreateRequest, Servicio } from '@/types';

const EMPTY_FORM: CategoriaCreateRequest = { nombre: '', descripcion: '', imagenUrl: null, activo: true };

export default function AdminCategoriasPage() {
  const toast = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaCreateRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [cats, srv] = await Promise.allSettled([catalogService.getCategories(), catalogService.getAllServices()]);
    setError(null);
    if (cats.status === 'fulfilled') setCategorias(cats.value.data ?? []);
    else setError(cats.reason instanceof Error ? cats.reason.message : '');
    if (srv.status === 'fulfilled') setServicios(srv.value.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const porCategoria = useMemo(() => {
    const map: Record<number, { total: number; activos: number }> = {};
    servicios.forEach((s) => {
      map[s.categoriaId] ??= { total: 0, activos: 0 };
      map[s.categoriaId].total++;
      if (s.activo) map[s.categoriaId].activos++;
    });
    return map;
  }, [servicios]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: Categoria) => {
    setEditing(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '', imagenUrl: c.imagenUrl, activo: c.activo });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const res = await catalogService.updateCategory({ ...editing, ...form });
        setCategorias((prev) => prev.map((c) => (c.id === editing.id ? res.data : c)));
        toast.success('Categoría actualizada');
      } else {
        const res = await catalogService.createCategory(form);
        setCategorias((prev) => [...prev, res.data]);
        toast.success('Categoría creada');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Especialidades con las que se agrupan los servicios."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} aria-label="Actualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          </>
        }
      />

      {error !== null && <ErrorBanner service="Micro-Catalogo" message={error} onRetry={refresh} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/50" />
          ))}
        </div>
      ) : categorias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800">
          <EmptyState
            icon={FolderTree}
            title="No hay categorías"
            action={
              <Button size="sm" onClick={openCreate}>
                Crear categoría
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categorias.map((c) => {
            const stats = porCategoria[c.id] ?? { total: 0, activos: 0 };
            return (
              <article
                key={c.id}
                className={cn(
                  'group flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition-colors hover:border-slate-700',
                  !c.activo && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                    <FolderTree className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant={c.activo ? 'success' : 'default'}>{c.activo ? 'Activa' : 'Inactiva'}</Badge>
                    <button
                      onClick={() => openEdit(c)}
                      aria-label={`Editar ${c.nombre}`}
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-white">{c.nombre}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-400">{c.descripcion || 'Sin descripción'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-medium text-white">{stats.total}</span> servicios
                    {stats.total > 0 && <span className="text-slate-600">· {stats.activos} activos</span>}
                  </span>
                  <Link href="/dashboard/servicios" className="text-teal-400 opacity-0 transition-opacity hover:text-teal-300 group-hover:opacity-100">
                    Ver →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        icon={FolderTree}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre">
            <input
              required
              maxLength={100}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Terapia respiratoria"
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción" hint={`${form.descripcion.length}/250`}>
            <textarea
              rows={3}
              maxLength={250}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="¿Qué tipo de tratamientos agrupa?"
              className={cn(fieldClass, 'resize-none')}
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-4 w-4 accent-teal-500"
            />
            <span className="text-sm text-slate-300">Categoría activa</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
