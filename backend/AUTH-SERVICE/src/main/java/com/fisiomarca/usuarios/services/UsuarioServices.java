package com.fisiomarca.usuarios.services;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fisiomarca.usuarios.dto.*;
import com.fisiomarca.usuarios.entity.Cliente;
import com.fisiomarca.usuarios.entity.Usuario;
import com.fisiomarca.usuarios.repository.ClienteRepository;
import com.fisiomarca.usuarios.repository.UsuarioRepository;
import com.fisiomarca.usuarios.utils.BusinessException;
import com.fisiomarca.usuarios.utils.ModeloNotFoundException;

@Service
public class UsuarioServices extends ICRUDImpl<Usuario, Integer> {
    private final UsuarioRepository repo;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioServices(UsuarioRepository repo, ClienteRepository clienteRepository, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public JpaRepository<Usuario, Integer> repo() { return repo; }

    // Cliente y Usuario se guardan juntos: si falla uno, no queda un cliente huerfano.
    @Transactional(rollbackFor = Exception.class)
    public Usuario registrarCliente(RegistroUsuarioDTO dto) throws Exception {
        if (!dto.getPassword().equals(dto.getConfirmarPassword()))
            throw new BusinessException("Las contraseñas no coinciden");

        String email = dto.getEmail().trim().toLowerCase();
        if (repo.existsByEmail(email) || clienteRepository.existsByEmail(email))
            throw new BusinessException("El correo ya está registrado");

        Cliente cliente = new Cliente();
        cliente.setNombreCompleto(dto.getNombreCompleto().trim());
        cliente.setTelefono(dto.getTelefono());
        cliente.setEmail(email);
        cliente = clienteRepository.save(cliente);

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(dto.getNombreCompleto().trim());
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol("CLIENTE");
        usuario.setActivo(true);
        usuario.setCliente(cliente);
        return registrar(usuario);
    }

    public Usuario buscarPorEmail(String email) {
        return repo.findByEmail(email)
                .orElseThrow(() -> new ModeloNotFoundException("Usuario no existe"));
    }

    public PerfilDTO obtenerPerfil(String email) {
        Usuario usuario = buscarPorEmail(email);
        Cliente cliente = usuario.getCliente();
        PerfilDTO dto = new PerfilDTO();
        dto.setUsuarioId(usuario.getId());
        dto.setNombreCompleto(usuario.getNombreCompleto());
        dto.setEmail(usuario.getEmail());
        dto.setRol(usuario.getRol());
        dto.setActivo(usuario.isActivo());
        if (cliente != null) {
            dto.setClienteId(cliente.getId());
            dto.setTelefono(cliente.getTelefono());
        }
        return dto;
    }

    public PerfilDTO actualizarPerfil(String email, ActualizarPerfilDTO dto) {
        Usuario usuario = buscarPorEmail(email);
        usuario.setNombreCompleto(dto.getNombreCompleto().trim());
        repo.save(usuario);

        if (usuario.getCliente() != null) {
            Cliente cliente = usuario.getCliente();
            cliente.setNombreCompleto(dto.getNombreCompleto().trim());
            cliente.setTelefono(dto.getTelefono());
            clienteRepository.save(cliente);
        }
        return obtenerPerfil(email);
    }

    public void cambiarPassword(String email, CambioPasswordDTO dto) {
        Usuario usuario = buscarPorEmail(email);
        if (!passwordEncoder.matches(dto.getPasswordActual(), usuario.getPasswordHash()))
            throw new BusinessException("La contraseña actual es incorrecta");
        if (!dto.getPasswordNueva().equals(dto.getConfirmarPassword()))
            throw new BusinessException("Las contraseñas nuevas no coinciden");

        usuario.setPasswordHash(passwordEncoder.encode(dto.getPasswordNueva()));
        repo.save(usuario);
    }
}
