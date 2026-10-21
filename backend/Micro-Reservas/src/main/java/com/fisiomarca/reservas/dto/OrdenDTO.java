package com.fisiomarca.reservas.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class OrdenDTO {
    private String codigo;
    private Integer clienteId;
    private String estado;
    private BigDecimal total;
    private LocalDateTime expiraEn;
    private LocalDateTime fechaPago;
    private String metodoPago;
    private String pagoReferencia;
    private List<ReservaDTO> reservas;
}
