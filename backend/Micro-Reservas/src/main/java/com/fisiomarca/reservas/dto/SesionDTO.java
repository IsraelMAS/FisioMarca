package com.fisiomarca.reservas.dto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class SesionDTO {
    @NotNull(message = "Cada sesión necesita un servicio")
    private Integer servicioId;
    @NotNull(message = "Cada sesión necesita fecha y hora")
    private LocalDateTime fechaHoraInicio;
}
