package com.fisiomarca.reservas.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Entity
@Table(name = "reservas")
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "cliente_id", nullable = false)
    private Integer clienteId;
    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;
    @Column(name = "fecha_hora_fin", nullable = false)
    private LocalDateTime fechaHoraFin;
    @Column(name = "precio_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioTotal;
    @Column(nullable = false, length = 30)
    private String estado = "PROGRAMADA";
    @Column(length = 500)
    private String notas;
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    @Column(name = "fisioterapeuta_id")
    private Integer fisioterapeutaId;
    @Column(name = "sala_id")
    private Integer salaId;
    @Column(name = "hora_llegada")
    private LocalDateTime horaLlegada;
    @Column(name = "orden_codigo", length = 20)
    private String ordenCodigo;
    @Column(name = "metodo_pago", length = 20)
    private String metodoPago;
    @Column(name = "pago_referencia", length = 60)
    private String pagoReferencia;
    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;
    @Column(name = "expira_en")
    private LocalDateTime expiraEn;
}
