package com.fisiomarca.usuarios.utils;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduce errores de autenticacion a respuestas JSON controladas.
 */
@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> credencialesInvalidas(BadCredentialsException ex) {
        return new ResponseEntity<>(new ApiResponse<>(false, "Usuario o contraseña incorrectos", null), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<?>> usuarioInactivo(DisabledException ex) {
        return new ResponseEntity<>(new ApiResponse<>(false, "El usuario está inactivo", null), HttpStatus.UNAUTHORIZED);
    }
}
