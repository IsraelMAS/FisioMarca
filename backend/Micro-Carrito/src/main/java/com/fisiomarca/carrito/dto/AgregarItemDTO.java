package com.fisiomarca.carrito.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class AgregarItemDTO {
    @NotNull(message = "El cliente es obligatorio")
    private Integer clienteId;
    @NotNull(message = "El servicio es obligatorio")
    private Integer servicioId;
    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad mínima es 1")
    private Integer cantidad;
}
