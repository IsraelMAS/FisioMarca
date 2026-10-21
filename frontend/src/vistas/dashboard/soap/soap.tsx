'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/admin/ui';
import { soapService } from '@/lib/api/soap.service';
import { apiSoap } from '@/lib/api/client';
import { formatCurrency, formatDuration } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Copy,
  Check,
  ExternalLink,
  Code2,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Servicio } from '@/types';

const SAMPLE_GET_ALL = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fis="http://fisiomarca.com/soap">
  <soapenv:Header/>
  <soapenv:Body>
    <fis:getServiciosRequest/>
  </soapenv:Body>
</soapenv:Envelope>`;

const SAMPLE_GET_ONE = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fis="http://fisiomarca.com/soap">
  <soapenv:Header/>
  <soapenv:Body>
    <fis:getServicioRequest>
      <fis:id>1</fis:id>
    </fis:getServicioRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

const SAMPLE_POST = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fis="http://fisiomarca.com/soap">
  <soapenv:Header/>
  <soapenv:Body>
    <fis:postServicioRequest>
      <fis:bean>
        <fis:id>0</fis:id>
        <fis:nombre>Drenaje linfático</fis:nombre>
        <fis:descripcion>Masaje suave para reducir la retención de líquidos</fis:descripcion>
        <fis:precio>60.0</fis:precio>
        <fis:duracionMinutos>50</fis:duracionMinutos>
        <fis:imagenUrl></fis:imagenUrl>
        <fis:activo>true</fis:activo>
        <fis:categoriaId>4</fis:categoriaId>
      </fis:bean>
    </fis:postServicioRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

// Indenta un XML de una sola línea; los elementos con solo texto quedan en una línea
function formatearXml(xml: string): string {
  const tokens = xml.replace(/>\s+</g, '><').trim().match(/<[^>]+>|[^<]+/g) ?? [];
  const lineas: string[] = [];
  let nivel = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const sangria = '  '.repeat(Math.max(nivel, 0));
    if (t.startsWith('</')) {
      nivel--;
      lineas.push('  '.repeat(Math.max(nivel, 0)) + t);
    } else if (t.startsWith('<?') || t.endsWith('/>')) {
      lineas.push(sangria + t);
    } else if (t.startsWith('<')) {
      const texto = tokens[i + 1];
      const cierre = tokens[i + 2];
      if (texto && !texto.startsWith('<') && cierre?.startsWith('</')) {
        lineas.push(sangria + t + texto.trim() + cierre);
        i += 2;
      } else if (texto?.startsWith('</')) {
        lineas.push(sangria + t + texto);
        i += 1;
      } else {
        lineas.push(sangria + t);
        nivel++;
      }
    } else if (t.trim()) {
      lineas.push(sangria + t.trim());
    }
  }
  return lineas.join('\n');
}

export default function SoapExplorerPage() {
  const [xmlInput, setXmlInput] = useState(SAMPLE_GET_ALL);
  const [rawXmlResponse, setRawXmlResponse] = useState<string>('');
  const [parsedServices, setParsedServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiadoXml, setCopiadoXml] = useState(false);

  const handleExecuteSoap = async () => {
    setLoading(true);
    setError(null);
    setRawXmlResponse('');
    setParsedServices([]);

    try {
      const responseText = await apiSoap(xmlInput);
      setRawXmlResponse(formatearXml(responseText));

      // Si fue getServiciosRequest, probamos parsear con soapService
      if (xmlInput.includes('getServiciosRequest')) {
        const data = await soapService.getAll();
        setParsedServices(data);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al enviar petición SOAP al Gateway / Micro-Soap'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const cleanXml = xmlInput.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const curl = `curl -X POST http://localhost:8080/ws -H "Content-Type: text/xml" -d "${cleanXml}"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOAP Explorer"
        description="Prueba en vivo los endpoints de Micro-Soap (contrato servicio.xsd) vía Gateway :8080/ws."
        actions={
          <>
            <a
              href="http://localhost:8098/ws/servicio.wsdl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <FileCode className="h-3.5 w-3.5 text-teal-400" />
              Ver WSDL Directo (8098)
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="http://localhost:8080/ws/servicio.wsdl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs font-medium text-teal-300 hover:bg-teal-500/20 transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-teal-400" />
              Ver WSDL Vía Gateway (8080)
              <ExternalLink className="h-3 w-3" />
            </a>
          </>
        }
      />

        {/* Templates Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold mr-2">Plantillas SOAP:</span>
          <button
            onClick={() => setXmlInput(SAMPLE_GET_ALL)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-teal-500/20 hover:text-teal-300 border border-slate-700"
          >
            getServiciosRequest (Listar Todos)
          </button>
          <button
            onClick={() => setXmlInput(SAMPLE_GET_ONE)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-teal-500/20 hover:text-teal-300 border border-slate-700"
          >
            getServicioRequest (Buscar ID: 1)
          </button>
          <button
            onClick={() => setXmlInput(SAMPLE_POST)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-teal-500/20 hover:text-teal-300 border border-slate-700"
          >
            postServicioRequest (Registrar)
          </button>
          <button
            onClick={() => setXmlInput(formatearXml(xmlInput))}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-teal-500/20 hover:text-teal-300 border border-slate-700"
          >
            Formatear XML
          </button>
          <button
            onClick={copyCurl}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado cURL' : 'Copiar comando cURL'}
          </button>
        </div>

        {/* XML Editor & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-teal-400" />
                Mensaje SOAP Request (XML Envelope)
              </span>
              <span className="text-[11px] font-mono text-slate-500">POST /ws</span>
            </div>
            <textarea
              rows={12}
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-300 leading-relaxed focus:outline-none focus:border-teal-500"
            />
            <Button
              onClick={handleExecuteSoap}
              disabled={loading}
              className="w-full gap-2 shadow-lg shadow-teal-500/20"
            >
              <Play className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Enviando petición SOAP...' : 'Ejecutar Petición SOAP'}
            </Button>
          </div>

          {/* Response Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-teal-400" />
                Respuesta SOAP Raw (XML Payload)
              </span>
              {rawXmlResponse && (
                <span className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(rawXmlResponse);
                        setCopiadoXml(true);
                        setTimeout(() => setCopiadoXml(false), 1500);
                      } catch {
                        /* portapapeles bloqueado */
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                  >
                    {copiadoXml ? <Check className="h-3 w-3 text-teal-400" /> : <Copy className="h-3 w-3" />}
                    {copiadoXml ? 'Copiado' : 'Copiar respuesta'}
                  </button>
                  <Badge variant="success">HTTP 200 OK</Badge>
                </span>
              )}
            </div>

            {error ? (
              <div className="flex-1 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono overflow-auto">
                {error}
                <p className="mt-2 text-slate-400 text-[11px]">
                  Verifica que Servidor-Eureka, Gateway y Micro-Soap estén corriendo en los puertos 8761, 8080 y 8098.
                </p>
              </div>
            ) : (
              <pre className="flex-1 font-mono text-xs p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 overflow-auto whitespace-pre-wrap leading-relaxed max-h-[295px]">
                {rawXmlResponse || 'Presiona "Ejecutar Petición SOAP" para enviar el XML y recibir la respuesta en vivo...'}
              </pre>
            )}
          </div>
        </div>

        {/* Parsed Services Table (if any) */}
        {parsedServices.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-400" />
                  Servicios Decodificados desde SOAP
                </h3>
                <p className="text-xs text-slate-400">
                  Respuesta procesada por fast-xml-parser en <code>soap.service.ts</code>
                </p>
              </div>
              <Badge variant="info">{parsedServices.length} servicios</Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Duración</th>
                    <th className="px-4 py-3">Categoría ID</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {parsedServices.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-bold text-teal-400">#{s.id}</td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-white">{s.nombre}</td>
                      <td className="px-4 py-2.5 text-teal-300">{formatCurrency(s.precio)}</td>
                      <td className="px-4 py-2.5 text-slate-400">{formatDuration(s.duracionMinutos)}</td>
                      <td className="px-4 py-2.5 text-slate-400">Cat #{s.categoriaId}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={s.activo ? 'success' : 'danger'}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}
