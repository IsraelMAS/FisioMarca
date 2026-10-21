package com.fisiomarca.reservas.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.reservas.entity.Fisioterapeuta;

public interface FisioterapeutaRepository extends JpaRepository<Fisioterapeuta, Integer> {
    List<Fisioterapeuta> findByActivoTrueOrderById();
}
