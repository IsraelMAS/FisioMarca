package com.fisiomarca.catalogo.controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.modelmapper.ModelMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.catalogo.dto.ServicioDTO;
import com.fisiomarca.catalogo.entity.Servicio;
import com.fisiomarca.catalogo.services.ServicioServices;
import com.fisiomarca.catalogo.utils.ApiResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/catalogo/servicios")
public class ServicioController {
    private final ServicioServices services;
    private final ModelMapper mapper;

    public ServicioController(ServicioServices services, ModelMapper mapper) {
        this.services = services;
        this.mapper = mapper;
    }

    private ServicioDTO convertir(Servicio servicio) {
        ServicioDTO dto = mapper.map(servicio, ServicioDTO.class);
        if (servicio.getCategoria() != null) {
            dto.setCategoriaId(servicio.getCategoria().getId());
            dto.setCategoriaNombre(servicio.getCategoria().getNombre());
        }
        return dto;
    }

    private List<ServicioDTO> convertirLista(List<Servicio> servicios) {
        List<ServicioDTO> lista = new ArrayList<>();
        for (Servicio servicio : servicios) lista.add(convertir(servicio));
        return lista;
    }

    @GetMapping("/lista")
    public ResponseEntity<ApiResponse<?>> lista() throws Exception {
        return new ResponseEntity<>(new ApiResponse<>(true, "Listado de servicios", convertirLista(services.listarTodos())), HttpStatus.OK);
    }

    @GetMapping("/activos")
    public ResponseEntity<ApiResponse<?>> activos() {
        return new ResponseEntity<>(new ApiResponse<>(true, "Servicios activos", convertirLista(services.listarActivos())), HttpStatus.OK);
    }

    @GetMapping("/filtro")
    public ResponseEntity<ApiResponse<?>> filtro(@RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal maxPrecio,
            @RequestParam(required = false) Integer categoriaId) {
        return new ResponseEntity<>(new ApiResponse<>(true, "Servicios filtrados",
                convertirLista(services.filtrar(q, maxPrecio, categoriaId))), HttpStatus.OK);
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<ApiResponse<?>> buscar(@PathVariable Integer id) throws Exception {
        return new ResponseEntity<>(new ApiResponse<>(true, "Servicio encontrado", convertir(services.buscar(id))), HttpStatus.OK);
    }

    @PostMapping("/registrar")
    public ResponseEntity<ApiResponse<?>> registrar(@Valid @RequestBody ServicioDTO dto) throws Exception {
        Servicio servicio = mapper.map(dto, Servicio.class);
        servicio = services.grabar(servicio, dto.getCategoriaId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Servicio registrado", convertir(servicio)), HttpStatus.CREATED);
    }

    @PutMapping("/actualizar")
    public ResponseEntity<ApiResponse<?>> actualizar(@Valid @RequestBody ServicioDTO dto) throws Exception {
        Servicio servicio = mapper.map(dto, Servicio.class);
        servicio = services.modificar(servicio, dto.getCategoriaId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Servicio actualizado", convertir(servicio)), HttpStatus.OK);
    }

    @PutMapping("/estado/{id}")
    public ResponseEntity<ApiResponse<?>> estado(@PathVariable Integer id, @RequestParam boolean activo) throws Exception {
        Servicio servicio = services.cambiarEstado(id, activo);
        return new ResponseEntity<>(new ApiResponse<>(true, "Estado del servicio actualizado", convertir(servicio)), HttpStatus.OK);
    }
}
