package com.fisiomarca.reservas.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class SlotDTO {
    private String hora;
    private boolean disponible;
    private String motivo;
}
