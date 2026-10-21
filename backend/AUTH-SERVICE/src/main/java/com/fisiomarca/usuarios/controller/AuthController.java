package com.fisiomarca.usuarios.controller;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.fisiomarca.usuarios.dto.*;
import com.fisiomarca.usuarios.entity.Usuario;
import com.fisiomarca.usuarios.security.JwtService;
import com.fisiomarca.usuarios.services.UsuarioServices;
import com.fisiomarca.usuarios.utils.ApiResponse;

import jakarta.validation.Valid;

/**
 * Endpoints de autenticacion (publicos).
 *  - POST /auth/register -> crea usuario CLIENTE
 *  - POST /auth/login    -> valida credenciales y emite el JWT
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioServices usuarioServices;
    private final ModelMapper mapper;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService,
            UsuarioServices usuarioServices, ModelMapper mapper) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioServices = usuarioServices;
        this.mapper = mapper;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> registrar(@Valid @RequestBody RegistroUsuarioDTO dto) throws Exception {
        Usuario usuario = usuarioServices.registrarCliente(dto);
        UsuarioDTO data = mapper.map(usuario, UsuarioDTO.class);
        if (usuario.getCliente() != null) data.setClienteId(usuario.getCliente().getId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Usuario registrado", data), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Valida usuario/contraseña con el AuthenticationManager (DaoAuthenticationProvider + BCrypt).
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        Usuario usuario = usuarioServices.buscarPorEmail(authentication.getName());
        String token = jwtService.generateToken(usuario);

        LoginResponse data = new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpiration(),
                usuario.getNombreCompleto(),
                usuario.getRol(),
                usuario.getCliente() != null ? usuario.getCliente().getId() : null);

        return new ResponseEntity<>(new ApiResponse<>(true, "Inicio de sesión correcto", data), HttpStatus.OK);
    }
}
