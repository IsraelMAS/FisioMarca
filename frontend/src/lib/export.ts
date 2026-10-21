// ─── Exportación a PDF y Excel ───────────────────────────────────────
// Las librerías se cargan solo al pulsar el botón (import dinámico) para no
// aumentar el peso inicial de la página.

export type Celda = string | number;

export interface Reporte {
  titulo: string;
  subtitulo?: string;
  columnas: string[];
  filas: Celda[][];
  archivo: string;
  resumen?: [string, string][];
}

const TEAL: [number, number, number] = [13, 148, 136];
const TINTA: [number, number, number] = [15, 42, 42];
const GRIS: [number, number, number] = [100, 116, 139];

const emitido = () =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

export const nombreArchivo = (base: string) =>
  `${base}-${new Date().toISOString().slice(0, 10)}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type JsPDF = import('jspdf').jsPDF;

function encabezado(doc: JsPDF, titulo: string, subtitulo?: string) {
  const ancho = doc.internal.pageSize.getWidth();
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, ancho, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FisioMarca', 40, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Centro de fisioterapia y rehabilitación · Lima, Perú', 40, 54);
  doc.text(`Emitido: ${emitido()}`, ancho - 40, 38, { align: 'right' });

  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(titulo, 40, 104);
  let y = 104;
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRIS);
    doc.text(subtitulo, 40, 122);
    y = 122;
  }
  return y + 20;
}

function piePagina(doc: JsPDF, nota?: string) {
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(40, alto - 40, ancho - 40, alto - 40);
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(nota ?? 'FisioMarca · Documento generado automáticamente', 40, alto - 26);
    doc.text(`Página ${i} de ${paginas}`, ancho - 40, alto - 26, { align: 'right' });
  }
}

function bloqueResumen(doc: JsPDF, resumen: [string, string][], y: number) {
  const ancho = doc.internal.pageSize.getWidth() - 80;
  const w = ancho / resumen.length;
  resumen.forEach(([etiqueta, valor], i) => {
    const x = 40 + i * w;
    doc.setFillColor(240, 250, 248);
    doc.roundedRect(x, y, w - 8, 46, 6, 6, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(etiqueta.toUpperCase(), x + 10, y + 17);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TINTA);
    doc.text(valor, x + 10, y + 36);
    doc.setFont('helvetica', 'normal');
  });
  return y + 62;
}

export async function exportarPDF(r: Reporte) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: r.columnas.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  let y = encabezado(doc, r.titulo, r.subtitulo);
  if (r.resumen?.length) y = bloqueResumen(doc, r.resumen, y);

  autoTable(doc, {
    head: [r.columnas],
    body: r.filas.map((f) => f.map(String)),
    startY: y,
    margin: { left: 40, right: 40, bottom: 56 },
    styles: { fontSize: 8.5, cellPadding: 6, textColor: TINTA, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: TINTA, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 250, 249] },
  });
  piePagina(doc);
  doc.save(`${r.archivo}.pdf`);
}

export async function exportarExcel(r: Reporte, hoja = 'Datos') {
  const ExcelJS = (await import('exceljs')).default;
  const libro = new ExcelJS.Workbook();
  libro.creator = 'FisioMarca';
  libro.created = new Date();
  const ws = libro.addWorksheet(hoja.slice(0, 31), { views: [{ state: 'frozen', ySplit: 4 }] });
  const n = r.columnas.length;

  ws.mergeCells(1, 1, 1, n);
  Object.assign(ws.getCell(1, 1), { value: `FisioMarca · ${r.titulo}` });
  ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FF0D9488' } };
  ws.mergeCells(2, 1, 2, n);
  ws.getCell(2, 1).value = `${r.subtitulo ? r.subtitulo + ' · ' : ''}Emitido: ${emitido()}`;
  ws.getCell(2, 1).font = { size: 9, color: { argb: 'FF64748B' } };

  const cabecera = ws.getRow(4);
  r.columnas.forEach((c, i) => (cabecera.getCell(i + 1).value = c));
  cabecera.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A2A' } };
    cell.alignment = { vertical: 'middle' };
  });
  cabecera.height = 20;

  r.filas.forEach((fila, i) => {
    const row = ws.getRow(5 + i);
    fila.forEach((v, j) => (row.getCell(j + 1).value = v));
    if (i % 2 === 1) row.eachCell((c) => (c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F8F6' } }));
  });

  r.columnas.forEach((c, i) => {
    const largo = Math.max(c.length, ...r.filas.map((f) => String(f[i] ?? '').length));
    ws.getColumn(i + 1).width = Math.min(48, Math.max(10, largo + 2));
  });
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + r.filas.length, column: n } };

  if (r.resumen?.length) {
    const inicio = 6 + r.filas.length;
    r.resumen.forEach(([k, v], i) => {
      ws.getCell(inicio + i, 1).value = k;
      ws.getCell(inicio + i, 1).font = { bold: true };
      ws.getCell(inicio + i, 2).value = v;
    });
  }

  const buffer = await libro.xlsx.writeBuffer();
  descargar(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${r.archivo}.xlsx`);
}

// ─── Comprobante de pago ─────────────────────────────────────────────
export interface DatosComprobante {
  codigo: string;
  paciente: string;
  email?: string;
  fechaPago: string;
  metodo: string;
  referencia: string;
  total: string;
  sesiones: { fecha: string; hora: string; tratamiento: string; fisioterapeuta: string; sala: string; precio: string }[];
}

export async function comprobantePDF(d: DatosComprobante) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  let y = encabezado(doc, 'Comprobante de pago', `Orden ${d.codigo}`);

  // Sello "PAGADO"
  doc.setDrawColor(5, 150, 105);
  doc.setTextColor(5, 150, 105);
  doc.setLineWidth(1.5);
  doc.roundedRect(ancho - 150, 88, 110, 34, 6, 6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PAGADO', ancho - 95, 110, { align: 'center' });
  doc.setLineWidth(0.5);

  const datos: [string, string][] = [
    ['Paciente', d.paciente],
    ['Correo', d.email ?? '—'],
    ['Fecha de pago', d.fechaPago],
    ['Método', `${d.metodo} · ${d.referencia}`],
  ];
  doc.setFontSize(10);
  datos.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRIS);
    doc.text(k, 40, y + i * 18);
    doc.setTextColor(...TINTA);
    doc.setFont('helvetica', 'bold');
    doc.text(v, 140, y + i * 18);
  });
  y += datos.length * 18 + 12;

  autoTable(doc, {
    head: [['Sesión', 'Fecha', 'Hora', 'Tratamiento', 'Fisioterapeuta', 'Sala', 'Precio']],
    body: d.sesiones.map((s, i) => [String(i + 1), s.fecha, s.hora, s.tratamiento, s.fisioterapeuta, s.sala, s.precio]),
    startY: y,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 6, textColor: TINTA, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: TINTA, textColor: 255 },
    columnStyles: { 6: { halign: 'right' } },
  });
  const fin = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFillColor(240, 250, 248);
  doc.roundedRect(ancho - 240, fin + 14, 200, 44, 6, 6, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRIS);
  doc.text('TOTAL PAGADO', ancho - 228, fin + 31);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TINTA);
  doc.text(d.total, ancho - 52, fin + 48, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text('Presenta este comprobante en recepción. Llega 10 minutos antes de tu cita.', 40, fin + 90);
  piePagina(doc, 'Pago simulado con fines académicos · Sin valor tributario');
  doc.save(`comprobante-${d.codigo}.pdf`);
}
