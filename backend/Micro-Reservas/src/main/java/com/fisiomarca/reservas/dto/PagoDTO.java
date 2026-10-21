package com.fisiomarca.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

// Pago simulado: nunca viaja el número completo de la tarjeta, solo sus últimos 4 dígitos
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class PagoDTO {
    @NotBlank(message = "Elige un método de pago")
    private String metodo;
    private String titular;
    private String marca;
    private String ultimos4;
    private String telefono;
    private String codigoAprobacion;
}
