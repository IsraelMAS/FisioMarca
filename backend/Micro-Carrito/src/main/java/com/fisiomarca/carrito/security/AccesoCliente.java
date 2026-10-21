package com.fisiomarca.carrito.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import com.fisiomarca.carrito.utils.AccesoDenegadoException;

// Un paciente solo puede operar sobre sus propios datos; el administrador sobre todos.
public final class AccesoCliente {
    private AccesoCliente() {}

    public static boolean esAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMINISTRADOR".equals(a.getAuthority()));
    }

    public static Integer clienteIdDelToken() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt && jwt.getToken().getClaim("clienteId") instanceof Number n)
            return n.intValue();
        return null;
    }

    public static void verificar(Integer clienteId) {
        if (esAdmin()) return;
        Integer propio = clienteIdDelToken();
        if (propio == null || !propio.equals(clienteId))
            throw new AccesoDenegadoException("No tienes permiso para acceder a datos de otro paciente");
    }
}
