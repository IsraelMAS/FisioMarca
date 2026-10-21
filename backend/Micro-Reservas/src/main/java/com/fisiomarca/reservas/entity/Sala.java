package com.fisiomarca.reservas.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Entity
@Table(name = "salas")
public class Sala {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, length = 80)
    private String nombre;
    @Column(length = 80)
    private String tipo;
    @Column(nullable = false)
    private Boolean activo = true;
}
