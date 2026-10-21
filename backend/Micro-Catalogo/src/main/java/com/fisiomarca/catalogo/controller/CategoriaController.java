package com.fisiomarca.catalogo.controller;

import java.util.ArrayList;
import java.util.List;
import org.modelmapper.ModelMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.catalogo.dto.CategoriaDTO;
import com.fisiomarca.catalogo.entity.Categoria;
import com.fisiomarca.catalogo.services.CategoriaServices;
import com.fisiomarca.catalogo.utils.ApiResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/catalogo/categorias")
public class CategoriaController {
    private final CategoriaServices services;
    private final ModelMapper mapper;

    public CategoriaController(CategoriaServices services, ModelMapper mapper) {
        this.services = services;
        this.mapper = mapper;
    }

    @GetMapping("/lista")
    public ResponseEntity<ApiResponse<?>> lista() throws Exception {
        List<CategoriaDTO> lista = new ArrayList<>();
        for (Categoria c : services.listarTodos()) lista.add(mapper.map(c, CategoriaDTO.class));
        return new ResponseEntity<>(new ApiResponse<>(true, "Listado de categorías", lista), HttpStatus.OK);
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<ApiResponse<?>> buscar(@PathVariable Integer id) throws Exception {
        CategoriaDTO dto = mapper.map(services.buscar(id), CategoriaDTO.class);
        return new ResponseEntity<>(new ApiResponse<>(true, "Categoría encontrada", dto), HttpStatus.OK);
    }

    @PostMapping("/registrar")
    public ResponseEntity<ApiResponse<?>> registrar(@Valid @RequestBody CategoriaDTO dto) throws Exception {
        Categoria categoria = services.grabar(mapper.map(dto, Categoria.class));
        return new ResponseEntity<>(new ApiResponse<>(true, "Categoría registrada", mapper.map(categoria, CategoriaDTO.class)), HttpStatus.CREATED);
    }

    @PutMapping("/actualizar")
    public ResponseEntity<ApiResponse<?>> actualizar(@Valid @RequestBody CategoriaDTO dto) throws Exception {
        Categoria categoria = services.modificar(mapper.map(dto, Categoria.class));
        return new ResponseEntity<>(new ApiResponse<>(true, "Categoría actualizada", mapper.map(categoria, CategoriaDTO.class)), HttpStatus.OK);
    }
}
