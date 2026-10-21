package com.fisiomarca.reservas.dto;

import java.util.List;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class DashboardDTO {
    private Integer totalReservas;
    private Integer programadas;
    private Integer atendidas;
    private Integer canceladas;
    private Double tasaCancelacion;
    private List<ChartPointDTO> reservasPorDia;
    private List<ChartPointDTO> topServicios;
    private List<ReservaDTO> proximas24Horas;
    private Integer enAtencion;
    private Integer citasHoy;
    private Integer pacientesActivos;
}
