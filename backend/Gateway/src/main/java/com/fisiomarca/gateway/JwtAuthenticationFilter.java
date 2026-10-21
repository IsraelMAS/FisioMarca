package com.fisiomarca.gateway;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Filtro global del Gateway: valida el JWT en cada peticion (HS256, mismo secreto que AUTH-SERVICE).
 * Deja pasar sin token:
 *   - /auth/login y /auth/register (emitir el token)
 *   - /usuarios/registrar (registro publico)
 *   - /ws/** (servicio SOAP)
 *   - peticiones OPTIONS (preflight CORS)
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/auth/login", "/auth/register", "/usuarios/registrar");

    private final SecretKey signingKey;

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("jwt.secret debe tener al menos 32 bytes para HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Preflight CORS
        if (HttpMethod.OPTIONS.equals(request.getMethod())) {
            return chain.filter(exchange);
        }
        // Rutas publicas de autenticacion
        if (PUBLIC_PATHS.contains(path)) {
            return chain.filter(exchange);
        }
        // Catalogo publico de solo lectura (mismas reglas que Micro-Catalogo: GET permitAll).
        // POST/PUT/DELETE si requieren token (y ademas rol ADMINISTRADOR en el micro).
        if (HttpMethod.GET.equals(request.getMethod()) && path.startsWith("/catalogo/")) {
            return chain.filter(exchange);
        }
        // El servicio SOAP se expone sin token (igual que en la referencia del profesor)
        if (path.equals("/ws") || path.startsWith("/ws/")) {
            return chain.filter(exchange);
        }

        String authorization = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return unauthorized(exchange, "Falta el encabezado Authorization: Bearer <token>");
        }

        String token = authorization.substring(7).trim();
        if (token.isEmpty()) {
            return unauthorized(exchange, "Token vacío");
        }

        try {
            // Verifica firma, estructura y expiracion (exp) del JWT.
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token);
            // Se conserva el header Authorization al reenviar la peticion.
            return chain.filter(exchange);
        } catch (JwtException | IllegalArgumentException ex) {
            return unauthorized(exchange, "Token inválido o expirado");
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        var response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"success\":false,\"mensaje\":\"" + message + "\",\"data\":null}")
                .getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body)));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
