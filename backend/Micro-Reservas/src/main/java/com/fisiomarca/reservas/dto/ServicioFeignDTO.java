package com.fisiomarca.reservas.dto;

import java.math.BigDecimal;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ServicioFeignDTO {
    private Integer id;
    private String nombre;
    private BigDecimal precio;
    private Integer duracionMinutos;
    private boolean activo;
    private Integer categoriaId;
    private String categoriaNombre;
}
