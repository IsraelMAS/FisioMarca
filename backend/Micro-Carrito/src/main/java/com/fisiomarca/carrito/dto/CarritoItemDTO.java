package com.fisiomarca.carrito.dto;

import java.math.BigDecimal;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class CarritoItemDTO {
    private Integer id;
    private Integer servicioId;
    private String servicioNombre;
    private String imagenUrl;
    private Integer duracionMinutos;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}
