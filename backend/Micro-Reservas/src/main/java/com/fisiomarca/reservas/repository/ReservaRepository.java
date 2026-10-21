package com.fisiomarca.reservas.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.reservas.entity.Reserva;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
    List<Reserva> findByClienteIdOrderByFechaHoraInicioDesc(Integer clienteId);
    List<Reserva> findByEstadoNot(String estado);
    List<Reserva> findByFechaHoraInicioBetweenOrderByFechaHoraInicio(LocalDateTime inicio, LocalDateTime fin);
    List<Reserva> findByFechaHoraInicioAfter(LocalDateTime inicio);
    List<Reserva> findByEstadoNotIn(List<String> estados);
    List<Reserva> findByOrdenCodigoOrderByFechaHoraInicio(String ordenCodigo);
    List<Reserva> findByEstadoAndExpiraEnBefore(String estado, LocalDateTime limite);
    List<Reserva> findByClienteIdAndEstado(Integer clienteId, String estado);
}
