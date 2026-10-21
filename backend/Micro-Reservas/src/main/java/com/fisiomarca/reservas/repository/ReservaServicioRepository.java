package com.fisiomarca.reservas.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.reservas.entity.ReservaServicio;

public interface ReservaServicioRepository extends JpaRepository<ReservaServicio, Integer> {
    List<ReservaServicio> findByReservaId(Integer reservaId);
}
