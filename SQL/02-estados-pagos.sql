-- ════════════════════════════════════════════════════════════════════
--  FISIOMARCA · Estados de pago para la demo (se ejecuta DESPUÉS de 01)
-- ════════════════════════════════════════════════════════════════════
--  Reparte pacientes en las pestañas del panel  Admin → Citas:
--    · Pago pendiente : 10 sesiones de 8 pacientes (antes 3 de 2)
--    · Expiradas      : 12 compras de 12 pacientes (antes 7)
--    · Canceladas     : 41 citas de 21 pacientes (antes 36 de 16)
--
--  Pagos pendientes: en producción el backend retiene el horario 10 min
--  (MINUTOS_PARA_PAGAR). Aquí las retenciones vencen de forma escalonada
--  entre 15 min y 3 h después de cargar el script, para que la pestaña
--  tenga datos durante la demo; al vencer, el backend (cada 30 s) las pasa
--  solas a "Expiradas" y libera el horario. Para reiniciar la demo:
--    docker compose down -v && docker compose up -d
--
--  Igual que 01: horas en UTC relativas al día en que se ejecuta, las citas
--  de domingo se omiten, sin choques de fisioterapeuta ni de sala,
--  1 sesión por día por paciente y máx. 4 citas activas.
-- ════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
USE fisiomarca_reservas;

-- ────────────────────────────────────────────────────────────────────
--  1. Pagos pendientes originales (01): vencimiento escalonado
-- ────────────────────────────────────────────────────────────────────
UPDATE reservas SET expira_en = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 25 MINUTE) WHERE estado = 'PENDIENTE_PAGO' AND orden_codigo = 'FM-P0001-LUMB2';
UPDATE reservas SET expira_en = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 40 MINUTE) WHERE estado = 'PENDIENTE_PAGO' AND orden_codigo = 'FM-P0002-POST1';

-- ────────────────────────────────────────────────────────────────────
--  2. Nuevos pagos pendientes (próximos días, horarios libres)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 283, 12, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -3 MINUTE), DATE_ADD(CURDATE(), INTERVAL 3765 MINUTE), DATE_ADD(CURDATE(), INTERVAL 3720 MINUTE), 'Pago en proceso', 55.00, 1, NULL, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), NULL, NULL, 'FM-P0003-CERV1', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 2 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 284, 14, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -6 MINUTE), DATE_ADD(CURDATE(), INTERVAL 2270 MINUTE), DATE_ADD(CURDATE(), INTERVAL 2220 MINUTE), 'Pago en proceso', 65.00, 1, NULL, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 60 MINUTE), NULL, NULL, 'FM-P0004-DESG2', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 1 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 285, 14, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -6 MINUTE), DATE_ADD(CURDATE(), INTERVAL 5510 MINUTE), DATE_ADD(CURDATE(), INTERVAL 5460 MINUTE), 'Pago en proceso', 65.00, 1, NULL, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 60 MINUTE), NULL, NULL, 'FM-P0004-DESG2', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 3 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 286, 18, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -2 MINUTE), DATE_ADD(CURDATE(), INTERVAL 6700 MINUTE), DATE_ADD(CURDATE(), INTERVAL 6660 MINUTE), 'Pago en proceso', 40.00, 3, NULL, 3, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 90 MINUTE), NULL, NULL, 'FM-P0005-RELA1', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 4 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 287, 20, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 MINUTE), DATE_ADD(CURDATE(), INTERVAL 8085 MINUTE), DATE_ADD(CURDATE(), INTERVAL 8040 MINUTE), 'Pago en proceso', 55.00, 1, NULL, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 120 MINUTE), NULL, NULL, 'FM-P0006-LUMB1', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 5 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 288, 21, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -4 MINUTE), DATE_ADD(CURDATE(), INTERVAL 9885 MINUTE), DATE_ADD(CURDATE(), INTERVAL 9840 MINUTE), 'Pago en proceso', 52.00, 1, NULL, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 150 MINUTE), NULL, NULL, 'FM-P0007-TOBI1', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 6 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 289, 23, 'PENDIENTE_PAGO', DATE_ADD(UTC_TIMESTAMP(), INTERVAL -5 MINUTE), DATE_ADD(CURDATE(), INTERVAL 2640 MINUTE), DATE_ADD(CURDATE(), INTERVAL 2580 MINUTE), 'Pago en proceso', 80.00, 4, NULL, 4, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 180 MINUTE), NULL, NULL, 'FM-P0008-POST1', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 1 DAY)) <> 1;

-- ────────────────────────────────────────────────────────────────────
--  3. Compras expiradas (no se pagaron a tiempo; horario liberado)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 290, 4, 'EXPIRADA', DATE_ADD(CURDATE(), INTERVAL -26460 MINUTE), DATE_ADD(CURDATE(), INTERVAL -25035 MINUTE), DATE_ADD(CURDATE(), INTERVAL -25080 MINUTE), 'Tiempo de pago agotado', 55.00, 1, NULL, 1, NULL, NULL, NULL, 'FM-X0009-ABAND', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -18 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 291, 10, 'EXPIRADA', DATE_ADD(CURDATE(), INTERVAL -22230 MINUTE), DATE_ADD(CURDATE(), INTERVAL -20360 MINUTE), DATE_ADD(CURDATE(), INTERVAL -20400 MINUTE), 'Compra cancelada por el paciente', 40.00, 3, NULL, 3, NULL, NULL, NULL, 'FM-X0010-ABAND', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -15 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 292, 16, 'EXPIRADA', DATE_ADD(CURDATE(), INTERVAL -13070 MINUTE), DATE_ADD(CURDATE(), INTERVAL -12135 MINUTE), DATE_ADD(CURDATE(), INTERVAL -12180 MINUTE), 'Tiempo de pago agotado', 45.00, 3, NULL, 3, NULL, NULL, NULL, 'FM-X0011-ABAND', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -9 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 293, 21, 'EXPIRADA', DATE_ADD(CURDATE(), INTERVAL -9100 MINUTE), DATE_ADD(CURDATE(), INTERVAL -7275 MINUTE), DATE_ADD(CURDATE(), INTERVAL -7320 MINUTE), 'Tiempo de pago agotado', 55.00, 2, NULL, 2, NULL, NULL, NULL, 'FM-X0012-ABAND', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -6 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 294, 22, 'EXPIRADA', DATE_ADD(CURDATE(), INTERVAL -5780 MINUTE), DATE_ADD(CURDATE(), INTERVAL -4455 MINUTE), DATE_ADD(CURDATE(), INTERVAL -4500 MINUTE), 'Tiempo de pago agotado', 52.00, 1, NULL, 1, NULL, NULL, NULL, 'FM-X0013-ABAND', NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -4 DAY)) <> 1;

-- ────────────────────────────────────────────────────────────────────
--  4. Cancelaciones de pacientes que no tenían ninguna
--     (pagadas online y en sede; pasadas y próximas)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 295, 15, 'CANCELADA', DATE_ADD(CURDATE(), INTERVAL -32120 MINUTE), DATE_ADD(CURDATE(), INTERVAL -27850 MINUTE), DATE_ADD(CURDATE(), INTERVAL -27900 MINUTE), 'Cancelada: Enfermedad', 65.00, 1, NULL, 1, NULL, DATE_ADD(CURDATE(), INTERVAL -32120 MINUTE), 'YAPE', 'FM-D0901-C7Q2M', 'Yape ••• 547 · Op. 512833' FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -20 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 296, 16, 'CANCELADA', DATE_ADD(CURDATE(), INTERVAL -18910 MINUTE), DATE_ADD(CURDATE(), INTERVAL -14655 MINUTE), DATE_ADD(CURDATE(), INTERVAL -14700 MINUTE), 'Cancelada: El paciente no puede asistir', 55.00, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -11 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 297, 20, 'CANCELADA', DATE_ADD(CURDATE(), INTERVAL -7350 MINUTE), DATE_ADD(CURDATE(), INTERVAL -4935 MINUTE), DATE_ADD(CURDATE(), INTERVAL -4980 MINUTE), 'Cancelada: Reprogramará luego', 55.00, 2, NULL, 2, NULL, DATE_ADD(CURDATE(), INTERVAL -7350 MINUTE), 'TARJETA', 'FM-D0902-R8KTW', 'Visa •••• 4242' FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL -4 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 298, 22, 'CANCELADA', DATE_ADD(CURDATE(), INTERVAL -340 MINUTE), DATE_ADD(CURDATE(), INTERVAL 5205 MINUTE), DATE_ADD(CURDATE(), INTERVAL 5160 MINUTE), 'Cancelada: Error al agendar', 52.00, 4, NULL, 4, NULL, DATE_ADD(CURDATE(), INTERVAL -340 MINUTE), 'PLIN', 'FM-D0903-PZ5LA', 'Plin ••• 214 · Op. 618204' FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 3 DAY)) <> 1;
INSERT INTO reservas (id, cliente_id, estado, fecha_creacion, fecha_hora_fin, fecha_hora_inicio, notas, precio_total, fisioterapeuta_id, hora_llegada, sala_id, expira_en, fecha_pago, metodo_pago, orden_codigo, pago_referencia) SELECT 299, 23, 'CANCELADA', DATE_ADD(CURDATE(), INTERVAL -210 MINUTE), DATE_ADD(CURDATE(), INTERVAL 2320 MINUTE), DATE_ADD(CURDATE(), INTERVAL 2280 MINUTE), 'Cancelada: El paciente no puede asistir', 40.00, 3, NULL, 3, NULL, DATE_ADD(CURDATE(), INTERVAL -210 MINUTE), 'TARJETA', 'FM-D0904-HB3JN', 'Visa •••• 0366' FROM DUAL WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 1 DAY)) <> 1;

-- ────────────────────────────────────────────────────────────────────
--  5. Detalle de servicios (solo de las reservas que se insertaron)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 283, 45, UTC_TIMESTAMP(), 55.00, 6, 283 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 283);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 284, 50, UTC_TIMESTAMP(), 65.00, 3, 284 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 284);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 285, 50, UTC_TIMESTAMP(), 65.00, 3, 285 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 285);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 286, 40, UTC_TIMESTAMP(), 40.00, 12, 286 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 286);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 287, 45, UTC_TIMESTAMP(), 55.00, 4, 287 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 287);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 288, 45, UTC_TIMESTAMP(), 52.00, 17, 288 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 288);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 289, 60, UTC_TIMESTAMP(), 80.00, 1, 289 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 289);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 290, 45, DATE_ADD(CURDATE(), INTERVAL -26460 MINUTE), 55.00, 4, 290 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 290);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 291, 40, DATE_ADD(CURDATE(), INTERVAL -22230 MINUTE), 40.00, 12, 291 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 291);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 292, 45, DATE_ADD(CURDATE(), INTERVAL -13070 MINUTE), 45.00, 13, 292 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 292);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 293, 45, DATE_ADD(CURDATE(), INTERVAL -9100 MINUTE), 55.00, 6, 293 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 293);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 294, 45, DATE_ADD(CURDATE(), INTERVAL -5780 MINUTE), 52.00, 17, 294 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 294);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 295, 50, DATE_ADD(CURDATE(), INTERVAL -32120 MINUTE), 65.00, 3, 295 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 295);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 296, 45, DATE_ADD(CURDATE(), INTERVAL -18910 MINUTE), 55.00, 4, 296 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 296);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 297, 45, DATE_ADD(CURDATE(), INTERVAL -7350 MINUTE), 55.00, 6, 297 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 297);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 298, 45, DATE_ADD(CURDATE(), INTERVAL -340 MINUTE), 52.00, 17, 298 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 298);
INSERT INTO reserva_servicios (id, duracion_minutos, fecha_creacion, precio_servicio, servicio_id, reserva_id) SELECT 299, 40, DATE_ADD(CURDATE(), INTERVAL -210 MINUTE), 40.00, 12, 299 FROM DUAL WHERE EXISTS (SELECT 1 FROM reservas WHERE id = 299);

-- ────────────────────────────────────────────────────────────────────
--  Verificación: reservas y pacientes por estado
-- ────────────────────────────────────────────────────────────────────
SELECT estado, COUNT(*) AS reservas, COUNT(DISTINCT cliente_id) AS pacientes
FROM fisiomarca_reservas.reservas
WHERE estado IN ('PENDIENTE_PAGO', 'EXPIRADA', 'CANCELADA')
GROUP BY estado;
