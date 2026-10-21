package com.fisiomarca.usuarios.dto;

import lombok.*;

/**
 * Respuesta de POST /auth/login.
 * El frontend debe enviar este token en cada peticion: Authorization: Bearer <token>
 */
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class LoginResponse {
    private String token;
    private String tipo = "Bearer";
    private long expiraEn;      // milisegundos de vigencia
    private String nombre;
    private String rol;
    private Integer clienteId;
}
