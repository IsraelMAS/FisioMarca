package com.fisiomarca.catalogo.services;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import com.fisiomarca.catalogo.entity.Categoria;
import com.fisiomarca.catalogo.repository.CategoriaRepository;
import com.fisiomarca.catalogo.utils.BusinessException;

@Service
public class CategoriaServices extends ICRUDImpl<Categoria, Integer> {
    private final CategoriaRepository repo;

    public CategoriaServices(CategoriaRepository repo) { this.repo = repo; }

    @Override
    public JpaRepository<Categoria, Integer> repo() { return repo; }

    public Categoria grabar(Categoria categoria) throws Exception {
        if (repo.existsByNombre(categoria.getNombre()))
            throw new BusinessException("Nombre de categoría ya existe");
        return registrar(categoria);
    }

    public Categoria modificar(Categoria categoria) throws Exception {
        buscar(categoria.getId());
        if (repo.existsByNombreAndIdNot(categoria.getNombre(), categoria.getId()))
            throw new BusinessException("Nombre de categoría ya existe");
        return actualizar(categoria);
    }
}
