package com.fisiomarca.reservas.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.reservas.utils.ApiResponse;

@FeignClient(name = "AUTH-SERVICE")
public interface UsuariosFeign {
    @GetMapping("/usuarios/clientes/existe/{id}")
    ApiResponse<Boolean> existeCliente(@PathVariable("id") Integer id);
}
