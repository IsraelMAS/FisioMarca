package com.fisiomarca.usuarios.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Getter;
import lombok.Setter;

/**
 * Lee la configuracion "jwt.*" del application.yml.
 *  - secret: clave Base64 (minimo 32 bytes) usada para firmar/validar con HS256.
 *  - expiration: tiempo de vida del token en milisegundos.
 */
@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private long expiration;
}
