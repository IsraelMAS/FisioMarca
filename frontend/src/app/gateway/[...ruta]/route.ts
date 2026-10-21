import type { NextRequest } from 'next/server';

// ─── Puente al Gateway ───────────────────────────────────────────────
// El navegador llama a /gateway/* en el mismo origen del front y este handler
// reenvía la petición al Gateway desde el servidor. Así no hay CORS ni
// "localhost:8080" fijo: funciona entrando por localhost, 127.0.0.1, la IP de la red u otra PC.
// En Docker GATEWAY_INTERNAL_URL vale http://gateway-service:8080 (red interna).

const GATEWAY_INTERNAL_URL = process.env.GATEWAY_INTERNAL_URL ?? 'http://localhost:8080';
const CABECERAS_PETICION = ['authorization', 'content-type', 'accept', 'accept-language', 'soapaction'];
const CABECERAS_OMITIDAS = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection']);

async function reenviar(request: NextRequest): Promise<Response> {
  const { pathname, search } = request.nextUrl;
  const destino = `${GATEWAY_INTERNAL_URL}${pathname.replace(/^\/gateway/, '')}${search}`;

  const headers = new Headers();
  for (const nombre of CABECERAS_PETICION) {
    const valor = request.headers.get(nombre);
    if (valor) headers.set(nombre, valor);
  }
  const conCuerpo = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const res = await fetch(destino, {
      method: request.method,
      headers,
      body: conCuerpo ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      signal: request.signal,
    });
    const respuesta = new Headers();
    res.headers.forEach((valor, nombre) => {
      if (!CABECERAS_OMITIDAS.has(nombre)) respuesta.set(nombre, valor);
    });
    return new Response(res.body, { status: res.status, headers: respuesta });
  } catch {
    return Response.json(
      { success: false, mensaje: 'El Gateway no responde. Verifica que el backend esté levantado (docker compose ps).', data: null },
      { status: 503 }
    );
  }
}

export { reenviar as GET, reenviar as POST, reenviar as PUT, reenviar as DELETE, reenviar as PATCH };
