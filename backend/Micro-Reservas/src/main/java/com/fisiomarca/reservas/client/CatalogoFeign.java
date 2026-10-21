package com.fisiomarca.reservas.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.reservas.dto.ServicioFeignDTO;
import com.fisiomarca.reservas.utils.ApiResponse;

@FeignClient(name = "MICRO-CATALOGO")
public interface CatalogoFeign {
    @GetMapping("/catalogo/servicios/buscar/{id}")
    ApiResponse<ServicioFeignDTO> buscarServicio(@PathVariable("id") Integer id);
}
