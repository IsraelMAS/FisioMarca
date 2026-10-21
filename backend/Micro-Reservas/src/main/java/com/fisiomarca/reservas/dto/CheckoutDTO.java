package com.fisiomarca.reservas.dto;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class CheckoutDTO {
    @NotNull(message = "El paciente es obligatorio")
    private Integer clienteId;
    @NotEmpty(message = "Agrega al menos una sesión")
    @Valid
    private List<SesionDTO> sesiones;
    @Size(max = 500, message = "Las notas admiten máximo 500 caracteres")
    private String notas;
}
