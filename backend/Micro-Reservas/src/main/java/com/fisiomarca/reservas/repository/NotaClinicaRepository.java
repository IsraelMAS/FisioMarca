package com.fisiomarca.reservas.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.reservas.entity.NotaClinica;

public interface NotaClinicaRepository extends JpaRepository<NotaClinica, Integer> {
    List<NotaClinica> findByClienteIdOrderByFechaDesc(Integer clienteId);
}
