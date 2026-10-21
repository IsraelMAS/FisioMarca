package com.fisiomarca.catalogo.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import com.fisiomarca.catalogo.entity.Categoria;
import com.fisiomarca.catalogo.entity.Servicio;
import com.fisiomarca.catalogo.repository.ServicioRepository;
import com.fisiomarca.catalogo.utils.BusinessException;

@Service
public class ServicioServices extends ICRUDImpl<Servicio, Integer> {
    private final ServicioRepository repo;
    private final CategoriaServices categoriaServices;

    public ServicioServices(ServicioRepository repo, CategoriaServices categoriaServices) {
        this.repo = repo;
        this.categoriaServices = categoriaServices;
    }

    @Override
    public JpaRepository<Servicio, Integer> repo() { return repo; }

    public Servicio grabar(Servicio servicio, Integer categoriaId) throws Exception {
        if (repo.existsByNombre(servicio.getNombre()))
            throw new BusinessException("Nombre de servicio ya existe");
        Categoria categoria = categoriaServices.buscar(categoriaId);
        servicio.setCategoria(categoria);
        return registrar(servicio);
    }

    public Servicio modificar(Servicio servicio, Integer categoriaId) throws Exception {
        buscar(servicio.getId());
        if (repo.existsByNombreAndIdNot(servicio.getNombre(), servicio.getId()))
            throw new BusinessException("Nombre de servicio ya existe");
        Categoria categoria = categoriaServices.buscar(categoriaId);
        servicio.setCategoria(categoria);
        return actualizar(servicio);
    }

    public List<Servicio> listarActivos() { return repo.findByActivoTrue(); }

    public List<Servicio> filtrar(String q, BigDecimal maxPrecio, Integer categoriaId) {
        List<Servicio> resultado = new ArrayList<>();
        String texto = q == null ? "" : q.trim().toLowerCase();

        for (Servicio servicio : repo.findByActivoTrue()) {
            boolean cumple = true;
            if (maxPrecio != null && servicio.getPrecio().compareTo(maxPrecio) > 0) cumple = false;
            if (categoriaId != null && (servicio.getCategoria() == null ||
                    !categoriaId.equals(servicio.getCategoria().getId()))) cumple = false;

            if (!texto.isBlank()) {
                String nombre = servicio.getNombre() == null ? "" : servicio.getNombre().toLowerCase();
                String descripcion = servicio.getDescripcion() == null ? "" : servicio.getDescripcion().toLowerCase();
                String categoria = servicio.getCategoria() == null ? "" : servicio.getCategoria().getNombre().toLowerCase();
                if (!nombre.contains(texto) && !descripcion.contains(texto) && !categoria.contains(texto)) cumple = false;
            }

            if (cumple) resultado.add(servicio);
        }
        return resultado;
    }

    public Servicio cambiarEstado(Integer id, boolean activo) throws Exception {
        Servicio servicio = buscar(id);
        servicio.setActivo(activo);
        return actualizar(servicio);
    }
}
