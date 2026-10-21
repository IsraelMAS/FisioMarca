// ─── Respuesta estándar del Gateway ───────────────────────────────────
// Todos los microservicios devuelven este formato
export interface ApiResponse<T = unknown> {
  success: boolean;
  mensaje: string;
  data: T;
}
