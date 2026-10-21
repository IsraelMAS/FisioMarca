package com.fisiomarca.carrito.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.fisiomarca.carrito.utils.ApiResponse;

@FeignClient(name = "AUTH-SERVICE")
public interface UsuariosFeign {
    @GetMapping("/usuarios/clientes/existe/{id}")
    ApiResponse<Boolean> existeCliente(@PathVariable("id") Integer id);
}
