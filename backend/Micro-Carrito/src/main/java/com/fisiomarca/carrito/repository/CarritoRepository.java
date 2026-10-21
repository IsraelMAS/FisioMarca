package com.fisiomarca.carrito.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.carrito.entity.Carrito;

public interface CarritoRepository extends JpaRepository<Carrito, Integer> {
    Optional<Carrito> findByClienteId(Integer clienteId);
}
