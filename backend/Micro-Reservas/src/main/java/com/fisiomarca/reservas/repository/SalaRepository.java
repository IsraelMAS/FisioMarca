package com.fisiomarca.reservas.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.reservas.entity.Sala;

public interface SalaRepository extends JpaRepository<Sala, Integer> {
    List<Sala> findByActivoTrueOrderById();
}
