package com.fisiomarca.usuarios.security;

import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.fisiomarca.usuarios.entity.Usuario;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Genera el JWT que el frontend usara como "Bearer <token>".
 * El token incluye los claims que los microservicios leen:
 *   - roles      -> usado por JwtGrantedAuthoritiesConverter (ROLE_...)
 *   - usuarioId  -> id del usuario
 *   - nombre     -> nombre completo
 *   - clienteId  -> id del cliente asociado (si existe)
 */
@Service
public class JwtService {

    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
    }

    // Obtiene el secreto, lo decodifica y crea la clave criptografica (HS256).
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(properties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Usuario usuario) {
        long now = System.currentTimeMillis();

        var builder = Jwts.builder()
                .subject(usuario.getEmail())
                .claim("roles", List.of(usuario.getRol()))
                .claim("usuarioId", usuario.getId())
                .claim("nombre", usuario.getNombreCompleto())
                .issuedAt(new Date(now))
                .expiration(new Date(now + properties.getExpiration()));

        if (usuario.getCliente() != null) {
            builder.claim("clienteId", usuario.getCliente().getId());
        }

        return builder.signWith(getSigningKey()).compact();
    }

    public long getExpiration() {
        return properties.getExpiration();
    }
}
