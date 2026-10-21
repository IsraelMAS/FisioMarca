package com.fisiomarca.reservas.security;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Resource Server del MICRO-RESERVAS.
 * Valida el JWT con el secreto compartido (HS256) que emite AUTH-SERVICE.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public JwtDecoder jwtDecoder(@Value("${jwt.secret}") String secret) {
        byte[] keyBytes = java.util.Base64.getDecoder().decode(secret);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("jwt.secret debe tener al menos 32 bytes para HS256");
        }
        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/reservas/lista", "/reservas/dashboard").hasRole("ADMINISTRADOR")
                // Reserva directa sin pago: solo el admin (cita presencial). El paciente usa /checkout + pago
                .requestMatchers(HttpMethod.POST, "/reservas/registrar").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/reservas/atender/**", "/reservas/checkin/**", "/reservas/reasignar/**").hasRole("ADMINISTRADOR")
                // Lectura para cualquier usuario autenticado (el historial valida que sea el propio paciente)
                .requestMatchers(HttpMethod.GET, "/reservas/fisioterapeutas/**", "/reservas/salas/**", "/reservas/historial/**").authenticated()
                .requestMatchers("/reservas/fisioterapeutas/**", "/reservas/salas/**", "/reservas/historial/**").hasRole("ADMINISTRADOR")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));
        return http.build();
    }
}
