package com.fisiomarca.reservas.dto;

import java.util.List;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class DisponibilidadDTO {
    private Integer duracionTotalMinutos;
    private List<SlotDTO> horarios;
}
