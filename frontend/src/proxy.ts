import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Proxy: se ejecuta en el servidor ANTES de mostrar cualquier página ───
// · Valida la firma y la vigencia del JWT de la cookie (mismo secreto que el backend).
// · Sin sesión, solo se ven Inicio, Servicios, Categorías, Login y Registro.
// · Cada rol solo entra a sus rutas: el admin al panel, el paciente a sus citas y carrito.
// · Las páginas privadas se envían sin caché para que "Atrás" no muestre datos tras cerrar sesión.

const JWT_SECRET = process.env.JWT_SECRET ?? '/urSDUIrV3z7QBnshgjDKBw7+MgBEYIki+/z42yAm/E=';
const COOKIE = 'fisiomarca_token';

const PUBLICAS = ['/', '/servicios', '/categorias', '/api/chat'];
const AUTENTICACION = ['/login', '/registro'];
const SOLO_ADMIN = ['/dashboard'];
const SOLO_PACIENTE = ['/reservas', '/carrito'];

type Rol = 'ADMINISTRADOR' | 'CLIENTE';

const coincide = (path: string, rutas: string[]) =>
  rutas.some((r) => (r === '/' ? path === '/' : path === r || path.startsWith(`${r}/`)));

function base64ABytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function rolDelToken(token: string | undefined): Promise<Rol | null> {
  if (!token) return null;
  const [header, payload, firma] = token.split('.');
  if (!header || !payload || !firma) return null;
  try {
    const clave = await crypto.subtle.importKey('raw', base64ABytes(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valida = await crypto.subtle.verify('HMAC', clave, base64ABytes(firma), new TextEncoder().encode(`${header}.${payload}`));
    if (!valida) return null;
    const datos = JSON.parse(new TextDecoder().decode(base64ABytes(payload)));
    if (typeof datos.exp === 'number' && datos.exp * 1000 <= Date.now()) return null;
    const rol = Array.isArray(datos.roles) ? datos.roles[0] : null;
    return rol === 'ADMINISTRADOR' || rol === 'CLIENTE' ? rol : null;
  } catch {
    return null;
  }
}

function sinCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

function seguridad(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}

const inicioDe = (rol: Rol) => (rol === 'ADMINISTRADOR' ? '/dashboard' : '/');

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const rol = await rolDelToken(token);

  const redirigir = (destino: string, conRetorno = false) => {
    const url = new URL(destino, request.url);
    if (conRetorno) url.searchParams.set('redirect', pathname + search);
    const res = NextResponse.redirect(url);
    if (token && !rol) res.cookies.delete(COOKIE); // cookie vencida o adulterada
    return seguridad(sinCache(res));
  };

  // Login / registro con sesión activa → a su inicio
  if (coincide(pathname, AUTENTICACION)) {
    if (rol) return redirigir(inicioDe(rol));
    return seguridad(sinCache(NextResponse.next()));
  }

  if (coincide(pathname, PUBLICAS)) return seguridad(NextResponse.next());

  // Cualquier otra ruta exige sesión
  if (!rol) return redirigir('/login', true);
  if (coincide(pathname, SOLO_ADMIN) && rol !== 'ADMINISTRADOR') return redirigir('/');
  if (coincide(pathname, SOLO_PACIENTE) && rol !== 'CLIENTE') return redirigir('/dashboard');

  return seguridad(sinCache(NextResponse.next()));
}

export const config = {
  // Todo excepto archivos estáticos, imágenes y la API (/gateway, la protege el Gateway con el JWT)
  matcher: ['/((?!gateway/|_next/static|_next/image|images/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)'],
};
