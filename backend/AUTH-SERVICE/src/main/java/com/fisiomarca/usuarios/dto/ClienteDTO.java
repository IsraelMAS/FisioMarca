package com.fisiomarca.usuarios.dto;

import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ClienteDTO {
    private Integer id;
    private String nombreCompleto;
    private String telefono;
    private String email;
    private LocalDateTime fechaCreacion;
}
