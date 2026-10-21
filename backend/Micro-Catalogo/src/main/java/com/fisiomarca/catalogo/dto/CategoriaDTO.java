package com.fisiomarca.catalogo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class CategoriaDTO {
    private Integer id;

    @NotBlank(message = "{categoria.nombre.blank}")
    @Size(max = 100, message = "{categoria.nombre.max}")
    private String nombre;

    @Size(max = 250, message = "{categoria.descripcion.max}")
    private String descripcion;

    private String imagenUrl;
    private boolean activo = true;
}
