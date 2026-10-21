package com.fisiomarca.reservas.dto;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ReservaRegistroDTO {
    @NotNull(message = "{reserva.cliente.notnull}")
    private Integer clienteId;
    @NotNull(message = "{reserva.inicio.notnull}")
    private LocalDateTime fechaHoraInicio;
    @NotEmpty(message = "{reserva.servicios.notempty}")
    private List<Integer> servicioIds;
    @Size(max = 500, message = "{reserva.notas.max}")
    private String notas;
    private Integer fisioterapeutaId;
}
