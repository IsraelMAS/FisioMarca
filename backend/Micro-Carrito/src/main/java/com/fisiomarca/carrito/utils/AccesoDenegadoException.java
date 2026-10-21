package com.fisiomarca.carrito.utils;

public class AccesoDenegadoException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public AccesoDenegadoException(String mensaje) {
        super(mensaje);
    }
}
