package com.fisiomarca.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class CambioPasswordDTO {
    @NotBlank(message = "La contraseña actual es obligatoria")
    private String passwordActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, message = "La nueva contraseña debe tener mínimo 6 caracteres")
    private String passwordNueva;

    @NotBlank(message = "Debe confirmar la nueva contraseña")
    private String confirmarPassword;
}
