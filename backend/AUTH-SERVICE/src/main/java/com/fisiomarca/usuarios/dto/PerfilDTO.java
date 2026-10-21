package com.fisiomarca.usuarios.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class PerfilDTO {
    private Integer usuarioId;
    private Integer clienteId;
    private String nombreCompleto;
    private String email;
    private String telefono;
    private String rol;
    private boolean activo;
}
