package com.fisiomarca.usuarios.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.usuarios.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    boolean existsByEmail(String email);
    Optional<Cliente> findByEmail(String email);
}
