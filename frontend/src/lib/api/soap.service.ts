// ─── MICRO-SOAP Adapter ──────────────────────────────────────────────
// Convierte XML SOAP → JSON tipado con fast-xml-parser
// El frontend NUNCA lidia con XML directamente.

import { XMLParser } from 'fast-xml-parser';
import { apiSoap } from './client';
import type { Servicio } from '@/types';

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true, // quita los prefijos SOAP (soapenv:, fis:)
});

// ─── Helpers para construir los envelopes SOAP ───────────────────────

const NAMESPACE = 'http://fisiomarca.com/soap';

function wrapEnvelope(bodyContent: string): string {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fis="${NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    ${bodyContent}
  </soapenv:Body>
</soapenv:Envelope>`;
}

// ─── Tipado de respuestas SOAP convertidas a JSON ────────────────────

interface SoapServicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  imagenUrl: string | null;
  activo: boolean;
  categoriaId: number;
}

// ─── Servicio SOAP público ───────────────────────────────────────────

export const soapService = {
  /**
   * Obtiene todos los servicios vía SOAP (getServiciosRequest)
   * Convierte la respuesta XML a un array tipado de Servicio[]
   */
  async getAll(): Promise<Servicio[]> {
    const xml = await apiSoap(
      wrapEnvelope('<fis:getServiciosRequest/>')
    );
    const parsed = parser.parse(xml);
    const body = parsed?.Envelope?.Body;
    const response = body?.getServiciosResponse;
    if (!response?.lista) return [];

    // fast-xml-parser devuelve un objeto si hay un solo elemento
    const items: SoapServicio[] = Array.isArray(response.lista)
      ? response.lista
      : [response.lista];

    return items.map(mapSoapToServicio);
  },

  /**
   * Obtiene un servicio por ID vía SOAP (getServicioRequest)
   */
  async getById(id: number): Promise<Servicio | null> {
    const xml = await apiSoap(
      wrapEnvelope(`<fis:getServicioRequest><fis:id>${id}</fis:id></fis:getServicioRequest>`)
    );
    const parsed = parser.parse(xml);
    const body = parsed?.Envelope?.Body;
    const bean = body?.getServicioResponse?.bean;
    if (!bean) return null;
    return mapSoapToServicio(bean);
  },
};

// ─── Mapper SOAP → Tipo TypeScript ──────────────────────────────────

function mapSoapToServicio(raw: SoapServicio): Servicio {
  return {
    id: Number(raw.id),
    nombre: String(raw.nombre ?? ''),
    descripcion: String(raw.descripcion ?? ''),
    precio: Number(raw.precio ?? 0),
    duracionMinutos: Number(raw.duracionMinutos ?? 0),
    imagenUrl: raw.imagenUrl ? String(raw.imagenUrl) : null,
    activo: raw.activo === true || raw.activo === (1 as unknown as boolean),
    categoriaId: Number(raw.categoriaId ?? 0),
  };
}
