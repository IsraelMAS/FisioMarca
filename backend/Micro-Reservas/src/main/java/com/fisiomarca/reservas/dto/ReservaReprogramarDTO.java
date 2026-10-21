package com.fisiomarca.reservas.dto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ReservaReprogramarDTO {
    @NotNull(message = "La nueva fecha y hora es obligatoria")
    private LocalDateTime fechaHoraInicio;
}
