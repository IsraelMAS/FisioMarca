package com.fisiomarca.reservas.dto;

import java.math.BigDecimal;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ReservaServicioDTO {
    private Integer id;
    private Integer servicioId;
    private String servicioNombre;
    private BigDecimal precioServicio;
    private Integer duracionMinutos;
}
