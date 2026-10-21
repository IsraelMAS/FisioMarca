package com.fisiomarca.usuarios.controller;

import java.util.ArrayList;
import java.util.List;
import org.modelmapper.ModelMapper;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.usuarios.dto.*;
import com.fisiomarca.usuarios.entity.*;
import com.fisiomarca.usuarios.services.*;
import com.fisiomarca.usuarios.utils.ApiResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
    private final UsuarioServices usuarioServices;
    private final ClienteServices clienteServices;
    private final ModelMapper mapper;

    public UsuarioController(UsuarioServices usuarioServices, ClienteServices clienteServices, ModelMapper mapper) {
        this.usuarioServices = usuarioServices;
        this.clienteServices = clienteServices;
        this.mapper = mapper;
    }

    private UsuarioDTO convertir(Usuario usuario) {
        UsuarioDTO dto = mapper.map(usuario, UsuarioDTO.class);
        if (usuario.getCliente() != null) dto.setClienteId(usuario.getCliente().getId());
        return dto;
    }

    @PostMapping("/registrar")
    public ResponseEntity<ApiResponse<?>> registrar(@Valid @RequestBody RegistroUsuarioDTO dto) throws Exception {
        Usuario usuario = usuarioServices.registrarCliente(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Usuario registrado", convertir(usuario)), HttpStatus.CREATED);
    }

    @GetMapping("/perfil")
    public ResponseEntity<ApiResponse<?>> perfil(Authentication authentication) {
        PerfilDTO dto = usuarioServices.obtenerPerfil(authentication.getName());
        return new ResponseEntity<>(new ApiResponse<>(true, "Perfil del usuario", dto), HttpStatus.OK);
    }

    @PutMapping("/perfil")
    public ResponseEntity<ApiResponse<?>> actualizarPerfil(Authentication authentication,
            @Valid @RequestBody ActualizarPerfilDTO dto) {
        PerfilDTO perfil = usuarioServices.actualizarPerfil(authentication.getName(), dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Perfil actualizado", perfil), HttpStatus.OK);
    }

    @PutMapping("/cambiar-password")
    public ResponseEntity<ApiResponse<?>> cambiarPassword(Authentication authentication,
            @Valid @RequestBody CambioPasswordDTO dto) {
        usuarioServices.cambiarPassword(authentication.getName(), dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Contraseña actualizada", null), HttpStatus.OK);
    }

    @GetMapping("/clientes/existe/{id}")
    public ResponseEntity<ApiResponse<?>> existeCliente(@PathVariable Integer id) {
        return new ResponseEntity<>(new ApiResponse<>(true, "Validación de cliente", clienteServices.existe(id)), HttpStatus.OK);
    }

    @GetMapping("/clientes/buscar/{id}")
    public ResponseEntity<ApiResponse<?>> buscarCliente(@PathVariable Integer id) throws Exception {
        ClienteDTO dto = mapper.map(clienteServices.buscar(id), ClienteDTO.class);
        return new ResponseEntity<>(new ApiResponse<>(true, "Cliente encontrado", dto), HttpStatus.OK);
    }

    @GetMapping("/lista")
    public ResponseEntity<ApiResponse<?>> lista() throws Exception {
        List<UsuarioDTO> lista = new ArrayList<>();
        for (Usuario u : usuarioServices.listarTodos()) lista.add(convertir(u));
        return new ResponseEntity<>(new ApiResponse<>(true, "Listado de usuarios", lista), HttpStatus.OK);
    }
}
