package com.fisiomarca.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ActualizarPerfilDTO {
    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 120, message = "El nombre admite máximo 120 caracteres")
    private String nombreCompleto;

    @Size(max = 20, message = "El teléfono admite máximo 20 caracteres")
    private String telefono;
}
