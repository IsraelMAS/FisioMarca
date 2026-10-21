package com.fisiomarca.catalogo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.catalogo.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    boolean existsByNombre(String nombre);
    boolean existsByNombreAndIdNot(String nombre, Integer id);
}
