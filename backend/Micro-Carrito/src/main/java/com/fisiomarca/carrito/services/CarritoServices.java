package com.fisiomarca.carrito.services;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import com.fisiomarca.carrito.client.*;
import com.fisiomarca.carrito.dto.*;
import com.fisiomarca.carrito.entity.*;
import com.fisiomarca.carrito.repository.*;
import com.fisiomarca.carrito.utils.*;

@Service
public class CarritoServices extends ICRUDImpl<Carrito, Integer> {
    // Regla de negocio: una compra admite como máximo 4 sesiones (sumando cantidades)
    public static final int MAX_SESIONES = 4;

    private final CarritoRepository repo;
    private final CarritoItemRepository itemRepo;
    private final CatalogoFeign catalogoFeign;
    private final UsuariosFeign usuariosFeign;

    public CarritoServices(CarritoRepository repo, CarritoItemRepository itemRepo,
            CatalogoFeign catalogoFeign, UsuariosFeign usuariosFeign) {
        this.repo = repo;
        this.itemRepo = itemRepo;
        this.catalogoFeign = catalogoFeign;
        this.usuariosFeign = usuariosFeign;
    }

    @Override
    public JpaRepository<Carrito, Integer> repo() { return repo; }

    public Carrito obtenerOCrear(Integer clienteId) throws Exception {
        Optional<Carrito> existente = repo.findByClienteId(clienteId);
        if (existente.isPresent()) return existente.get();

        ApiResponse<Boolean> cliente = usuariosFeign.existeCliente(clienteId);
        if (cliente == null || !Boolean.TRUE.equals(cliente.getData()))
            throw new BusinessException("El cliente no existe");

        Carrito carrito = new Carrito();
        carrito.setClienteId(clienteId);
        return registrar(carrito);
    }

    public CarritoItem agregar(AgregarItemDTO dto) throws Exception {
        ApiResponse<ServicioFeignDTO> respuesta = catalogoFeign.buscarServicio(dto.getServicioId());
        if (respuesta == null || respuesta.getData() == null)
            throw new BusinessException("El servicio no existe");
        ServicioFeignDTO servicio = respuesta.getData();
        if (!servicio.isActivo()) throw new BusinessException("El servicio no está disponible");

        Carrito carrito = obtenerOCrear(dto.getClienteId());
        Optional<CarritoItem> existente = itemRepo.findByCarritoIdAndServicioId(carrito.getId(), dto.getServicioId());
        validarTope(carrito.getId(), existente.map(CarritoItem::getId).orElse(null),
                (existente.isPresent() ? existente.get().getCantidad() : 0) + dto.getCantidad());
        CarritoItem item = existente.isPresent() ? existente.get() : new CarritoItem();
        item.setCarrito(carrito);
        item.setServicioId(dto.getServicioId());
        int cantidad = existente.isPresent() ? item.getCantidad() + dto.getCantidad() : dto.getCantidad();
        item.setCantidad(cantidad);
        item.setPrecioUnitario(servicio.getPrecio());
        item.setSubtotal(servicio.getPrecio().multiply(BigDecimal.valueOf(cantidad)));
        return itemRepo.save(item);
    }

    public CarritoItem cambiarCantidad(Integer clienteId, Integer itemId, Integer cantidad) throws Exception {
        if (cantidad == null || cantidad < 1) throw new BusinessException("La cantidad mínima es 1");
        Carrito carrito = obtenerOCrear(clienteId);
        CarritoItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new ModeloNotFoundException("Item no existe"));
        if (!item.getCarrito().getId().equals(carrito.getId()))
            throw new BusinessException("El item no pertenece a este carrito");
        validarTope(carrito.getId(), item.getId(), cantidad);

        ApiResponse<ServicioFeignDTO> respuesta = catalogoFeign.buscarServicio(item.getServicioId());
        if (respuesta == null || respuesta.getData() == null || !respuesta.getData().isActivo())
            throw new BusinessException("El servicio ya no está disponible");
        item.setCantidad(cantidad);
        item.setPrecioUnitario(respuesta.getData().getPrecio());
        item.setSubtotal(respuesta.getData().getPrecio().multiply(BigDecimal.valueOf(cantidad)));
        return itemRepo.save(item);
    }

    private void validarTope(Integer carritoId, Integer itemIgnorado, int cantidadNueva) {
        int otras = 0;
        for (CarritoItem i : itemRepo.findByCarritoId(carritoId))
            if (!i.getId().equals(itemIgnorado)) otras += i.getCantidad();
        if (otras + cantidadNueva > MAX_SESIONES)
            throw new BusinessException("Máximo " + MAX_SESIONES + " sesiones por compra. Ya tienes " + otras + " en el carrito.");
    }

    public List<CarritoItem> listarItems(Integer clienteId) throws Exception {
        Carrito carrito = obtenerOCrear(clienteId);
        return itemRepo.findByCarritoId(carrito.getId());
    }

    public Carrito obtenerPorCliente(Integer clienteId) throws Exception {
        return obtenerOCrear(clienteId);
    }

    public void eliminarItem(Integer clienteId, Integer itemId) throws Exception {
        Carrito carrito = obtenerOCrear(clienteId);
        CarritoItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new ModeloNotFoundException("Item no existe"));
        if (!item.getCarrito().getId().equals(carrito.getId()))
            throw new BusinessException("El item no pertenece a este carrito");
        itemRepo.delete(item);
    }

    public void vaciar(Integer clienteId) throws Exception {
        Carrito carrito = obtenerOCrear(clienteId);
        List<CarritoItem> items = itemRepo.findByCarritoId(carrito.getId());
        for (CarritoItem item : items) itemRepo.delete(item);
    }

}
