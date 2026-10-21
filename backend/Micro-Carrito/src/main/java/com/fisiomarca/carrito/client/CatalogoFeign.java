package com.fisiomarca.carrito.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.carrito.dto.ServicioFeignDTO;
import com.fisiomarca.carrito.utils.ApiResponse;

@FeignClient(name = "MICRO-CATALOGO")
public interface CatalogoFeign {
    @GetMapping("/catalogo/servicios/buscar/{id}")
    ApiResponse<ServicioFeignDTO> buscarServicio(@PathVariable("id") Integer id);
}
