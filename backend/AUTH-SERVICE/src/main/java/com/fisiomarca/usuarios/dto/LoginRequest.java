package com.fisiomarca.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Credenciales enviadas a POST /auth/login.
 */
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "El correo es obligatorio")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
