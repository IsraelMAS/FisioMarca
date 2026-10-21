package com.fisiomarca.catalogo.services;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fisiomarca.catalogo.interfaces.ICRUD;
import com.fisiomarca.catalogo.utils.ModeloNotFoundException;

public abstract class ICRUDImpl<T, ID> implements ICRUD<T, ID> {
    public abstract JpaRepository<T, ID> repo();

    @Override
    public T registrar(T bean) throws Exception {
        return repo().save(bean);
    }

    @Override
    public T actualizar(T bean) throws Exception {
        return repo().save(bean);
    }

    @Override
    public void eliminar(ID cod) throws Exception {
        repo().deleteById(cod);
    }

    @Override
    public T buscar(ID cod) throws Exception {
        return repo().findById(cod)
                .orElseThrow(() -> new ModeloNotFoundException("Código: " + cod + " no existe"));
    }

    @Override
    public List<T> listarTodos() throws Exception {
        return repo().findAll();
    }
}
