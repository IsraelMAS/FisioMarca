package com.fisiomarca.carrito.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class CarritoDTO {
    private Integer id;
    private Integer clienteId;
    private LocalDateTime fechaCreacion;
    private List<CarritoItemDTO> items;
    private BigDecimal total;
    private Integer duracionTotalMinutos;
}
