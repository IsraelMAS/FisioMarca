package com.fisiomarca.carrito.controller;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.carrito.client.CatalogoFeign;
import com.fisiomarca.carrito.dto.*;
import com.fisiomarca.carrito.entity.*;
import com.fisiomarca.carrito.security.AccesoCliente;
import com.fisiomarca.carrito.services.CarritoServices;
import com.fisiomarca.carrito.utils.ApiResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/carrito")
public class CarritoController {
    private final CarritoServices services;
    private final CatalogoFeign catalogoFeign;

    public CarritoController(CarritoServices services, CatalogoFeign catalogoFeign) {
        this.services = services;
        this.catalogoFeign = catalogoFeign;
    }

    private CarritoDTO convertir(Integer clienteId) throws Exception {
        Carrito carrito = services.obtenerPorCliente(clienteId);
        List<CarritoItemDTO> itemsDTO = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        int duracion = 0;

        for (CarritoItem item : services.listarItems(clienteId)) {
            CarritoItemDTO dto = new CarritoItemDTO();
            dto.setId(item.getId());
            dto.setServicioId(item.getServicioId());
            dto.setCantidad(item.getCantidad());
            dto.setPrecioUnitario(item.getPrecioUnitario());
            dto.setSubtotal(item.getSubtotal());

            ApiResponse<ServicioFeignDTO> servicio = catalogoFeign.buscarServicio(item.getServicioId());
            if (servicio != null && servicio.getData() != null) {
                dto.setServicioNombre(servicio.getData().getNombre());
                dto.setImagenUrl(servicio.getData().getImagenUrl());
                dto.setDuracionMinutos(servicio.getData().getDuracionMinutos());
                int minutos = servicio.getData().getDuracionMinutos() == null ? 0 : servicio.getData().getDuracionMinutos();
                duracion += minutos * item.getCantidad();
            }
            itemsDTO.add(dto);
            total = total.add(item.getSubtotal());
        }
        return new CarritoDTO(carrito.getId(), carrito.getClienteId(), carrito.getFechaCreacion(), itemsDTO, total, duracion);
    }

    @GetMapping("/{clienteId}")
    public ResponseEntity<ApiResponse<?>> ver(@PathVariable Integer clienteId) throws Exception {
        AccesoCliente.verificar(clienteId);
        return new ResponseEntity<>(new ApiResponse<>(true, "Carrito del cliente", convertir(clienteId)), HttpStatus.OK);
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<?>> agregar(@Valid @RequestBody AgregarItemDTO dto) throws Exception {
        AccesoCliente.verificar(dto.getClienteId());
        services.agregar(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Servicio agregado al carrito", convertir(dto.getClienteId())), HttpStatus.CREATED);
    }

    @PutMapping("/{clienteId}/items/{itemId}")
    public ResponseEntity<ApiResponse<?>> cantidad(@PathVariable Integer clienteId, @PathVariable Integer itemId,
            @RequestParam Integer cantidad) throws Exception {
        AccesoCliente.verificar(clienteId);
        services.cambiarCantidad(clienteId, itemId, cantidad);
        return new ResponseEntity<>(new ApiResponse<>(true, "Cantidad actualizada", convertir(clienteId)), HttpStatus.OK);
    }

    @DeleteMapping("/{clienteId}/items/{itemId}")
    public ResponseEntity<ApiResponse<?>> eliminar(@PathVariable Integer clienteId, @PathVariable Integer itemId) throws Exception {
        AccesoCliente.verificar(clienteId);
        services.eliminarItem(clienteId, itemId);
        return new ResponseEntity<>(new ApiResponse<>(true, "Item eliminado", convertir(clienteId)), HttpStatus.OK);
    }

    @DeleteMapping("/{clienteId}/vaciar")
    public ResponseEntity<ApiResponse<?>> vaciar(@PathVariable Integer clienteId) throws Exception {
        AccesoCliente.verificar(clienteId);
        services.vaciar(clienteId);
        return new ResponseEntity<>(new ApiResponse<>(true, "Carrito vaciado", convertir(clienteId)), HttpStatus.OK);
    }

}
