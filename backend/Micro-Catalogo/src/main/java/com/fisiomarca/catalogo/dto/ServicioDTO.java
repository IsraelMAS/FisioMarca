package com.fisiomarca.catalogo.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class ServicioDTO {
    private Integer id;

    @NotBlank(message = "{servicio.nombre.blank}")
    @Size(max = 120, message = "{servicio.nombre.max}")
    private String nombre;

    @Size(max = 255, message = "{servicio.descripcion.max}")
    private String descripcion;

    @NotNull(message = "{servicio.precio.notnull}")
    @DecimalMin(value = "0.01", message = "{servicio.precio.min}")
    private BigDecimal precio;

    @NotNull(message = "{servicio.duracion.notnull}")
    @Min(value = 1, message = "{servicio.duracion.min}")
    private Integer duracionMinutos;

    private String imagenUrl;
    private boolean activo = true;

    @NotNull(message = "{servicio.categoria.notnull}")
    private Integer categoriaId;
    private String categoriaNombre;
}
