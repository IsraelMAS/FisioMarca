package com.fisiomarca.reservas.controller;

import java.time.LocalDate;
import java.util.*;
import org.modelmapper.ModelMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.reservas.dto.*;
import com.fisiomarca.reservas.entity.*;
import com.fisiomarca.reservas.security.AccesoCliente;
import com.fisiomarca.reservas.services.ReservaServices;
import com.fisiomarca.reservas.utils.ApiResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/reservas")
public class ReservaController {
    private final ReservaServices services;
    private final ModelMapper mapper;

    public ReservaController(ReservaServices services, ModelMapper mapper) {
        this.services = services;
        this.mapper = mapper;
    }

    private ReservaDTO convertir(Reserva reserva) {
        ReservaDTO dto = mapper.map(reserva, ReservaDTO.class);
        List<ReservaServicioDTO> detalles = new ArrayList<>();
        for (ReservaServicio detalle : services.listarServicios(reserva.getId())) {
            ReservaServicioDTO d = mapper.map(detalle, ReservaServicioDTO.class);
            d.setServicioNombre(services.obtenerNombreServicio(detalle.getServicioId()));
            detalles.add(d);
        }
        dto.setServicios(detalles);
        return dto;
    }

    private List<ReservaDTO> convertirLista(List<Reserva> reservas) {
        List<ReservaDTO> lista = new ArrayList<>();
        for (Reserva r : reservas) lista.add(convertir(r));
        return lista;
    }

    // ─── Compra online: checkout (reserva temporal) → pago ─────────────
    private OrdenDTO convertirOrden(List<Reserva> reservas) {
        Reserva primera = reservas.get(0);
        java.math.BigDecimal total = reservas.stream().map(Reserva::getPrecioTotal)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        return new OrdenDTO(primera.getOrdenCodigo(), primera.getClienteId(), ReservaServices.estadoOrden(reservas), total,
                primera.getExpiraEn(), primera.getFechaPago(), primera.getMetodoPago(), primera.getPagoReferencia(),
                convertirLista(reservas));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<?>> checkout(@Valid @RequestBody CheckoutDTO dto) throws Exception {
        AccesoCliente.verificar(dto.getClienteId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Horarios reservados por " + ReservaServices.MINUTOS_PARA_PAGAR
                + " minutos mientras completas el pago", convertirOrden(services.checkout(dto))), HttpStatus.CREATED);
    }

    @GetMapping("/orden/{codigo}")
    public ResponseEntity<ApiResponse<?>> verOrden(@PathVariable String codigo) {
        List<Reserva> reservas = services.orden(codigo);
        AccesoCliente.verificar(reservas.get(0).getClienteId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Orden " + codigo, convertirOrden(reservas)));
    }

    @PostMapping("/orden/{codigo}/pagar")
    public ResponseEntity<ApiResponse<?>> pagar(@PathVariable String codigo, @Valid @RequestBody PagoDTO pago) {
        AccesoCliente.verificar(services.orden(codigo).get(0).getClienteId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Pago aprobado", convertirOrden(services.pagar(codigo, pago))));
    }

    @PutMapping("/orden/{codigo}/cancelar")
    public ResponseEntity<ApiResponse<?>> cancelarOrden(@PathVariable String codigo) {
        AccesoCliente.verificar(services.orden(codigo).get(0).getClienteId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Horarios liberados", convertirOrden(services.cancelarOrden(codigo))));
    }

    @PostMapping("/registrar")
    public ResponseEntity<ApiResponse<?>> registrar(@Valid @RequestBody ReservaRegistroDTO dto) throws Exception {
        AccesoCliente.verificar(dto.getClienteId());
        Reserva reserva = services.registrarReserva(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Reserva registrada", convertir(reserva)), HttpStatus.CREATED);
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<ApiResponse<?>> disponibilidad(@RequestParam LocalDate fecha,
            @RequestParam List<Integer> servicioIds) {
        DisponibilidadDTO dto = services.disponibilidad(fecha, servicioIds);
        return new ResponseEntity<>(new ApiResponse<>(true, "Horarios disponibles", dto), HttpStatus.OK);
    }

    @GetMapping("/buscar/{id}")
    public ResponseEntity<ApiResponse<?>> buscar(@PathVariable Integer id) throws Exception {
        Reserva reserva = services.buscar(id);
        AccesoCliente.verificar(reserva.getClienteId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Reserva encontrada", convertir(reserva)), HttpStatus.OK);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<ApiResponse<?>> porCliente(@PathVariable Integer clienteId) {
        AccesoCliente.verificar(clienteId);
        return new ResponseEntity<>(new ApiResponse<>(true, "Reservas del cliente",
                convertirLista(services.listarPorCliente(clienteId))), HttpStatus.OK);
    }

    @GetMapping("/lista")
    public ResponseEntity<ApiResponse<?>> lista() throws Exception {
        return new ResponseEntity<>(new ApiResponse<>(true, "Listado de reservas",
                convertirLista(services.listarTodos())), HttpStatus.OK);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<?>> dashboard(@RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta) {
        return new ResponseEntity<>(new ApiResponse<>(true, "Datos del dashboard",
                services.dashboard(desde, hasta)), HttpStatus.OK);
    }

    @PutMapping("/cancelar/{id}")
    public ResponseEntity<ApiResponse<?>> cancelar(@PathVariable Integer id,
            @RequestParam(required = false) String motivo) throws Exception {
        AccesoCliente.verificar(services.buscar(id).getClienteId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Reserva cancelada", convertir(services.cancelar(id, motivo))), HttpStatus.OK);
    }

    @PutMapping("/checkin/{id}")
    public ResponseEntity<ApiResponse<?>> checkin(@PathVariable Integer id) throws Exception {
        return new ResponseEntity<>(new ApiResponse<>(true, "Llegada registrada", convertir(services.checkin(id))), HttpStatus.OK);
    }

    @PutMapping("/reasignar/{id}")
    public ResponseEntity<ApiResponse<?>> reasignar(@PathVariable Integer id, @RequestBody ReasignarDTO dto) throws Exception {
        return new ResponseEntity<>(new ApiResponse<>(true, "Cita reasignada", convertir(services.reasignar(id, dto))), HttpStatus.OK);
    }

    @PutMapping("/reprogramar/{id}")
    public ResponseEntity<ApiResponse<?>> reprogramar(@PathVariable Integer id,
            @Valid @RequestBody ReservaReprogramarDTO dto) throws Exception {
        AccesoCliente.verificar(services.buscar(id).getClienteId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Reserva reprogramada",
                convertir(services.reprogramar(id, dto.getFechaHoraInicio()))), HttpStatus.OK);
    }

    @PutMapping("/atender/{id}")
    public ResponseEntity<ApiResponse<?>> atender(@PathVariable Integer id) throws Exception {
        return new ResponseEntity<>(new ApiResponse<>(true, "Reserva marcada como atendida",
                convertir(services.marcarAtendida(id))), HttpStatus.OK);
    }
}
