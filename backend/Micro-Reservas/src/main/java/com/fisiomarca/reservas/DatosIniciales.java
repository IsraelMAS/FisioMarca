package com.fisiomarca.reservas;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import com.fisiomarca.reservas.entity.*;
import com.fisiomarca.reservas.repository.*;
import com.fisiomarca.reservas.services.ReservaServices;

@Configuration
public class DatosIniciales {

    @Bean
    CommandLineRunner sembrarEquipo(FisioterapeutaRepository fisioRepo, SalaRepository salaRepo,
            ReservaRepository reservaRepo, ReservaServices reservaServices) {
        return args -> {
            if (fisioRepo.count() == 0) {
                fisioRepo.saveAll(List.of(
                    new Fisioterapeuta(null, "Lic. Andrea Salazar", "Traumatología y deporte", "#2dd4bf", true),
                    new Fisioterapeuta(null, "Lic. Jorge Ramírez", "Neurorrehabilitación", "#38bdf8", true),
                    new Fisioterapeuta(null, "Lic. Lucía Paredes", "Terapia manual y masajes", "#a78bfa", true),
                    new Fisioterapeuta(null, "Lic. Martín Huamán", "Postoperatorio", "#fbbf24", true)));
            }
            if (salaRepo.count() == 0) {
                salaRepo.saveAll(List.of(
                    new Sala(null, "Box 1", "Camilla individual", true),
                    new Sala(null, "Box 2", "Camilla individual", true),
                    new Sala(null, "Gimnasio terapéutico", "Ejercicio y readaptación", true),
                    new Sala(null, "Sala de electroterapia", "Equipos y agentes físicos", true)));
            }
            // Reservas creadas antes de existir el equipo: se les asigna fisioterapeuta y sala libres
            for (Reserva r : reservaRepo.findByEstadoNot("CANCELADA")) {
                if (r.getFisioterapeutaId() != null && r.getSalaId() != null) continue;
                try {
                    reservaServices.asignarRecursos(r, r.getFisioterapeutaId(), false);
                    reservaRepo.save(r);
                } catch (RuntimeException ignored) {
                    // sin recursos libres en ese horario: se puede reasignar desde el panel
                }
            }
        };
    }
}
