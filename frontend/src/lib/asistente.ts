// ─── Conocimiento local del asistente "Marca" (sin IA ni red) ────────
// Lo usan los botones de respuesta rápida del chat (respuesta instantánea)
// y /api/chat como respaldo cuando no hay clave de IA configurada.
// Para añadir una molestia u objetivo basta con agregar una fila abajo.

export interface Accion {
  etiqueta: string;
  ir?: string; // id de otro paso del menú
  href?: string; // enlace interno del sitio
}

export interface Paso {
  texto: string;
  acciones: Accion[];
}

interface Tema {
  id: string;
  etiqueta: string;
  patron: RegExp; // palabras clave, sin tildes
  respuesta: string;
}

// Molestias → tratamiento sugerido
const MOLESTIAS: Tema[] = [
  { id: 'espalda', etiqueta: 'Espalda baja', patron: /espalda|lumbar|cintura|ciatic/, respuesta: '**Lumbalgia** (S/55 · 45 min) y, si hay contractura, **Descontracturante** (S/45).' },
  { id: 'cuello', etiqueta: 'Cuello', patron: /cuello|cervical|nuca/, respuesta: '**Cervicalgia** (S/55 · 45 min).' },
  { id: 'tobillo', etiqueta: 'Tobillo', patron: /tobillo|esguince|torcedura/, respuesta: '**Esguince de tobillo** (S/52 · 45 min) y **Vendaje neuromuscular** (S/35).' },
  { id: 'rodilla', etiqueta: 'Rodilla', patron: /rodilla|ligamento|menisco/, respuesta: '**Lesión de ligamentos** (S/75 · 55 min).' },
  { id: 'cirugia', etiqueta: 'Tras una cirugía', patron: /operaci|cirug|postoperatori|protesis/, respuesta: '**Post operatorio** (S/80 · 60 min) con la Lic. Martín Huamán.' },
  { id: 'cara', etiqueta: 'Parálisis facial', patron: /cara|facial|paralisis/, respuesta: '**Parálisis facial** (S/70 · 50 min).' },
  { id: 'acv', etiqueta: 'Secuelas de ACV', patron: /acv|derrame|hemipl|neurolog/, respuesta: '**ACV, rehabilitación neuromotora** (S/90 · 60 min) con el Lic. Jorge Ramírez.' },
  { id: 'musculo', etiqueta: 'Músculo / desgarro', patron: /desgarr|musculo|calambre/, respuesta: '**Desgarros** (S/65 · 50 min) o **Descarga muscular** (S/50).' },
];

// Objetivos de bienestar → recomendación
const OBJETIVOS: Tema[] = [
  { id: 'estres', etiqueta: 'Estrés y tensión', patron: /estres|relaj|tension|ansiedad/, respuesta: '**Relajante** (S/40) o **Piedras calientes** (S/50).' },
  { id: 'postura', etiqueta: 'Mejorar mi postura', patron: /postura|escoliosis|joroba/, respuesta: '**Evaluación postural** (S/45 · 45 min).' },
  { id: 'deporte', etiqueta: 'Deporte y prevención', patron: /deport|prevenir|prevencion|ejercicio/, respuesta: '**Ejercicios preventivos** (S/40 · 50 min).' },
];

const HORARIO =
  'Atendemos de **lunes a sábado**, de **07:00 a 12:00** y de **14:00 a 19:00**. Los domingos está cerrado.';
const COMO_RESERVAR =
  'Para reservar:\n- En **Servicios** añade sesiones al carrito con + y −.\n- Pulsa **Agendar y pagar** y elige día y hora de cada sesión.\n- Paga con tarjeta, Yape o Plin (tus horarios se apartan 10 minutos).\nMáximo 4 sesiones por compra y 1 por día.';

const sugerencia = (t: Tema) =>
  `Por lo que cuentas, te puede ayudar: ${t.respuesta}\nEn la primera sesión el fisioterapeuta te evalúa y ajusta el plan. Puedes reservar desde **Servicios → Reservar**.`;

const MENU: Accion = { etiqueta: '↩ Menú principal', ir: 'inicio' };
const RESERVAR: Accion = { etiqueta: 'Reservar ahora', href: '/servicios' };

// Botones del inicio: también se muestran si la IA tarda en responder
export const ACCIONES_INICIO: Accion[] = [
  { etiqueta: '📅 Reservar / Consultar horarios', ir: 'horarios' },
  { etiqueta: '🩺 ¿Qué te duele?', ir: 'dolor' },
  { etiqueta: '💡 Recomendaciones de tratamiento', ir: 'recomendaciones' },
];

export const PASOS: Record<string, Paso> = {
  inicio: { texto: '¿En qué te ayudo? Elige una opción o escribe tu consulta.', acciones: ACCIONES_INICIO },
  horarios: {
    texto: `${HORARIO}\n\n${COMO_RESERVAR}`,
    acciones: [RESERVAR, { etiqueta: 'Mis citas', href: '/reservas' }, MENU],
  },
  dolor: {
    texto: '¿Dónde sientes la molestia? Si el dolor es intenso y repentino, acude a emergencias.',
    acciones: [...MOLESTIAS.map((t) => ({ etiqueta: t.etiqueta, ir: t.id })), MENU],
  },
  recomendaciones: {
    texto:
      'Recomendaciones generales:\n- Pausas activas cada hora si trabajas sentado.\n- Calienta antes de hacer deporte y estira al terminar.\n- Ante un golpe o torcedura: reposo, frío y elevación las primeras 48 h.\n¿Qué te gustaría mejorar?',
    acciones: [...OBJETIVOS.map((t) => ({ etiqueta: t.etiqueta, ir: t.id })), MENU],
  },
  ...Object.fromEntries(
    MOLESTIAS.map((t) => [t.id, { texto: sugerencia(t), acciones: [RESERVAR, { etiqueta: 'Otra molestia', ir: 'dolor' }, MENU] }])
  ),
  ...Object.fromEntries(
    OBJETIVOS.map((t) => [t.id, { texto: sugerencia(t), acciones: [RESERVAR, { etiqueta: 'Otra recomendación', ir: 'recomendaciones' }, MENU] }])
  ),
};

// Respuesta por palabras clave para texto libre (modo sin clave de IA)
export function respuestaLocal(pregunta: string): string {
  const t = pregunta.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/pecho|falta de aire|no puedo respirar|desmay|perdi la fuerza|no puedo hablar|accidente|golpe en la cabeza|insoportable/.test(t))
    return 'Eso puede ser una emergencia. Acude de inmediato a la emergencia más cercana o llama al **106 (SAMU)**. No esperes una cita de fisioterapia.';
  const tema = [...MOLESTIAS, ...OBJETIVOS].find(({ patron }) => patron.test(t));
  if (tema) return sugerencia(tema);
  if (/horario|hora|abren|atienden|domingo|sabado/.test(t)) return HORARIO;
  if (/precio|costo|cuanto|tarifa|vale/.test(t))
    return 'Las sesiones cuestan entre **S/35 y S/90** según el tratamiento. Por ejemplo: Lumbalgia S/55, Cervicalgia S/55, Post operatorio S/80, Relajante S/40. Puedes ver todos en **Servicios**.';
  if (/reserv|cita|agend|pag|yape|plin|tarjeta|carrito/.test(t)) return COMO_RESERVAR;
  return 'Puedo orientarte sobre tratamientos, horarios, precios y cómo reservar. Cuéntame dónde sientes la molestia, o escríbenos por WhatsApp al **+51 926 021 752** para hablar con una persona.';
}
