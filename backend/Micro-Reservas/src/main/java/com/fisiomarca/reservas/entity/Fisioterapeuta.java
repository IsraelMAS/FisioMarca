package com.fisiomarca.reservas.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Entity
@Table(name = "fisioterapeutas")
public class Fisioterapeuta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, length = 120)
    private String nombre;
    @Column(length = 120)
    private String especialidad;
    @Column(length = 9)
    private String color = "#2dd4bf";
    @Column(nullable = false)
    private Boolean activo = true;
}
