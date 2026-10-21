package com.fisiomarca.usuarios.security;

import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import com.fisiomarca.usuarios.entity.Usuario;
import com.fisiomarca.usuarios.repository.UsuarioRepository;

@Service
public class UsuarioDetailsService implements UserDetailsService {
    private final UsuarioRepository repo;
    public UsuarioDetailsService(UsuarioRepository repo) { this.repo = repo; }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = repo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no existe"));
        if (!usuario.isActivo()) throw new UsernameNotFoundException("Usuario inactivo");
        return User.withUsername(usuario.getEmail())
                .password(usuario.getPasswordHash())
                .roles(usuario.getRol())
                .build();
    }
}
