package com.fisiomarca.reservas.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Entity
@Table(name = "notas_clinicas")
public class NotaClinica {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "cliente_id", nullable = false)
    private Integer clienteId;
    @Column(name = "reserva_id")
    private Integer reservaId;
    @Column(name = "fisioterapeuta_id")
    private Integer fisioterapeutaId;
    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
    @Column(nullable = false, length = 200)
    private String motivo;
    @Column(length = 2000)
    private String evolucion;
    @Column(name = "nivel_dolor")
    private Integer nivelDolor;
    @Column(length = 1000)
    private String plan;
}
