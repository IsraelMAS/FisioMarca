package com.fisiomarca.catalogo.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.catalogo.entity.Servicio;

public interface ServicioRepository extends JpaRepository<Servicio, Integer> {
    boolean existsByNombre(String nombre);
    boolean existsByNombreAndIdNot(String nombre, Integer id);
    List<Servicio> findByActivoTrue();
}
