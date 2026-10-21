package com.fisiomarca.usuarios.dto;

import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class UsuarioDTO {
    private Integer id;
    private String nombreCompleto;
    private String email;
    private String rol;
    private boolean activo;
    private LocalDateTime fechaCreacion;
    private Integer clienteId;
}
