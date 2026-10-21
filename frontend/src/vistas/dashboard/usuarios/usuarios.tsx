'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { authService } from '@/lib/api/auth.service';
import { formatDate } from '@/lib/format';
import { iniciales } from '@/lib/admin';
import { exportarExcel, exportarPDF, nombreArchivo, type Reporte } from '@/lib/export';
import { ExportButtons } from '@/components/ui/export-buttons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Panel,
  SearchInput,
  Segmented,
  SkeletonRows,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/admin/ui';
import type { AdminUser } from '@/types';

type Filtro = 'TODOS' | AdminUser['rol'];

const SQL_PROMOVER =
  "UPDATE fisiomarca_usuarios.usuarios SET rol = 'ADMINISTRADOR' WHERE email = 'correo@ejemplo.com';";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [nuevos, setNuevos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authService.listUsers();
      setError(null);
      setUsuarios(res.data ?? []);
      // Se calcula al cargar (no en el render) para no usar la hora durante el prerender
      const hace30 = Date.now() - 30 * 86400000;
      setNuevos((res.data ?? []).filter((u) => u.fechaCreacion && new Date(u.fechaCreacion).getTime() >= hace30).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const stats = useMemo(() => {
    const admins = usuarios.filter((u) => u.rol === 'ADMINISTRADOR').length;
    return { total: usuarios.length, admins, clientes: usuarios.length - admins, nuevos };
  }, [usuarios, nuevos]);

  const filtered = usuarios.filter((u) => {
    if (filtro !== 'TODOS' && u.rol !== filtro) return false;
    const q = search.trim().toLowerCase();
    return !q || u.nombreCompleto?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const reporte = (): Reporte => ({
    titulo: 'Registro de usuarios',
    subtitulo: `${filtered.length} cuentas${filtro !== 'TODOS' ? ` · ${filtro === 'CLIENTE' ? 'pacientes' : 'administradores'}` : ''}`,
    columnas: ['ID', 'Nombre', 'Correo', 'Rol', 'Estado', 'Registrado', 'Historia'],
    filas: filtered.map((u) => [
      u.id,
      u.nombreCompleto,
      u.email,
      u.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Paciente',
      u.activo ? 'Activo' : 'Inactivo',
      u.fechaCreacion ? u.fechaCreacion.slice(0, 10) : '—',
      u.clienteId ? `#${u.clienteId}` : '—',
    ]),
    resumen: [
      ['Usuarios', String(stats.total)],
      ['Pacientes', String(stats.clientes)],
      ['Nuevos (30 días)', String(stats.nuevos)],
    ],
    archivo: nombreArchivo('usuarios-fisiomarca'),
  });

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_PROMOVER);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* el portapapeles puede estar bloqueado */
    }
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas registradas en AUTH-SERVICE."
        actions={
          <>
            <ExportButtons
              disabled={loading || filtered.length === 0}
              onPDF={() => exportarPDF(reporte())}
              onExcel={() => exportarExcel(reporte(), 'Usuarios')}
            />
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </>
        }
      />

      {error !== null && <ErrorBanner service="AUTH-SERVICE" message={error} onRetry={refresh} />}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Usuarios" value={stats.total} icon={Users} loading={loading} />
        <StatCard label="Pacientes" value={stats.clientes} icon={UserCheck} tone="sky" loading={loading} />
        <StatCard label="Administradores" value={stats.admins} icon={ShieldCheck} tone="amber" loading={loading} />
        <StatCard label="Nuevos (30 días)" value={stats.nuevos} icon={UserPlus} tone="emerald" loading={loading} />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: 'TODOS', label: 'Todos', count: stats.total },
            { value: 'CLIENTE', label: 'Pacientes', count: stats.clientes },
            { value: 'ADMINISTRADOR', label: 'Admins', count: stats.admins },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o correo" />
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Usuario</Th>
            <Th>Rol</Th>
            <Th>Estado</Th>
            <Th>Registrado</Th>
            <Th className="text-right">Cliente</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {loading ? (
            <SkeletonRows cols={5} />
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={Users} title="Sin usuarios que mostrar" />
              </td>
            </tr>
          ) : (
            filtered.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-slate-800/20">
                <Td>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        u.rol === 'ADMINISTRADOR' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {iniciales(u.nombreCompleto)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{u.nombreCompleto}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {u.rol === 'ADMINISTRADOR' ? (
                    <Badge variant="warning" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge>Paciente</Badge>
                  )}
                </Td>
                <Td>
                  <span className="flex items-center gap-2 text-xs text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-slate-400">{u.fechaCreacion ? formatDate(u.fechaCreacion) : '—'}</Td>
                <Td className="text-right font-mono text-xs text-slate-500">{u.clienteId ? `#${u.clienteId}` : '—'}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Panel
        className="mt-6"
        title="Dar rol de administrador"
        description="Por seguridad, toda cuenta nueva se crea como paciente. Para promover una, ejecuta en MySQL:"
      >
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-teal-300">{SQL_PROMOVER}</code>
          <button
            onClick={copySql}
            aria-label="Copiar SQL"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </Panel>
    </>
  );
}
