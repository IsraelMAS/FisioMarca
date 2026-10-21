package com.fisiomarca.carrito.repository;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.carrito.entity.CarritoItem;

public interface CarritoItemRepository extends JpaRepository<CarritoItem, Integer> {
    List<CarritoItem> findByCarritoId(Integer carritoId);
    Optional<CarritoItem> findByCarritoIdAndServicioId(Integer carritoId, Integer servicioId);
}
