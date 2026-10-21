package com.fisiomarca.reservas.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ReservaDTO {
    private Integer id;
    private Integer clienteId;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private BigDecimal precioTotal;
    private String estado;
    private String notas;
    private LocalDateTime fechaCreacion;
    private Integer fisioterapeutaId;
    private Integer salaId;
    private LocalDateTime horaLlegada;
    private String ordenCodigo;
    private String metodoPago;
    private String pagoReferencia;
    private LocalDateTime fechaPago;
    private LocalDateTime expiraEn;
    private List<ReservaServicioDTO> servicios;
}
