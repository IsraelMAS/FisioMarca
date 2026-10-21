package com.fisiomarca.usuarios.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class RegistroUsuarioDTO {
    @NotBlank(message = "{usuario.nombre.blank}")
    @Size(max = 120, message = "{usuario.nombre.max}")
    private String nombreCompleto;

    @NotBlank(message = "{usuario.email.blank}")
    @Email(message = "{usuario.email.email}")
    @Size(max = 120, message = "{usuario.email.max}")
    private String email;

    @Size(max = 20, message = "{cliente.telefono.max}")
    private String telefono;

    @NotBlank(message = "{usuario.password.blank}")
    @Size(min = 6, message = "{usuario.password.min}")
    private String password;

    @NotBlank(message = "{usuario.password.confirmar}")
    private String confirmarPassword;
}
