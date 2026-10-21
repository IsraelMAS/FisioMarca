package com.fisiomarca.reservas.services;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import com.fisiomarca.reservas.client.*;
import com.fisiomarca.reservas.dto.*;
import com.fisiomarca.reservas.entity.*;
import com.fisiomarca.reservas.repository.*;
import com.fisiomarca.reservas.utils.*;

@Service
public class ReservaServices extends ICRUDImpl<Reserva, Integer> {
    private static final int PASO_MINUTOS = 30;
    private final ReservaRepository repo;
    private final ReservaServicioRepository detalleRepo;
    private final CatalogoFeign catalogoFeign;
    private final UsuariosFeign usuariosFeign;
    private final FisioterapeutaRepository fisioRepo;
    private final SalaRepository salaRepo;

    public ReservaServices(ReservaRepository repo, ReservaServicioRepository detalleRepo,
            CatalogoFeign catalogoFeign, UsuariosFeign usuariosFeign,
            FisioterapeutaRepository fisioRepo, SalaRepository salaRepo) {
        this.fisioRepo = fisioRepo;
        this.salaRepo = salaRepo;
        this.repo = repo;
        this.detalleRepo = detalleRepo;
        this.catalogoFeign = catalogoFeign;
        this.usuariosFeign = usuariosFeign;
    }

    @Override
    public JpaRepository<Reserva, Integer> repo() { return repo; }

    private List<ServicioFeignDTO> cargarServicios(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) throw new BusinessException("Debe seleccionar al menos un servicio");
        List<ServicioFeignDTO> servicios = new ArrayList<>();
        for (Integer idServicio : ids) {
            ApiResponse<ServicioFeignDTO> respuesta = catalogoFeign.buscarServicio(idServicio);
            if (respuesta == null || respuesta.getData() == null)
                throw new BusinessException("Servicio " + idServicio + " no existe");
            ServicioFeignDTO servicio = respuesta.getData();
            if (!servicio.isActivo())
                throw new BusinessException("Servicio " + servicio.getNombre() + " no está disponible");
            servicios.add(servicio);
        }
        return servicios;
    }

    private int calcularDuracion(List<ServicioFeignDTO> servicios) {
        int minutos = 0;
        for (ServicioFeignDTO servicio : servicios) {
            int duracion = servicio.getDuracionMinutos() == null || servicio.getDuracionMinutos() <= 0
                    ? 45 : servicio.getDuracionMinutos();
            minutos += duracion;
        }
        return minutos;
    }

    private BigDecimal calcularTotal(List<ServicioFeignDTO> servicios) {
        BigDecimal total = BigDecimal.ZERO;
        for (ServicioFeignDTO servicio : servicios) total = total.add(servicio.getPrecio());
        return total;
    }

    public Reserva registrarReserva(ReservaRegistroDTO dto) throws Exception {
        ApiResponse<Boolean> cliente = usuariosFeign.existeCliente(dto.getClienteId());
        if (cliente == null || !Boolean.TRUE.equals(cliente.getData()))
            throw new BusinessException("El cliente no existe");
        if (dto.getFechaHoraInicio().isBefore(LocalDateTime.now()))
            throw new BusinessException("No se puede reservar en una fecha pasada");

        List<ServicioFeignDTO> servicios = cargarServicios(dto.getServicioIds());
        int minutos = calcularDuracion(servicios);
        BigDecimal total = calcularTotal(servicios);
        LocalDateTime fin = dto.getFechaHoraInicio().plusMinutes(minutos);

        validarHorarioAtencion(dto.getFechaHoraInicio(), fin);
        validarCruce(dto.getFechaHoraInicio(), fin, null);
        validarCrucePaciente(dto.getClienteId(), dto.getFechaHoraInicio(), fin, null);

        Reserva reserva = new Reserva();
        reserva.setClienteId(dto.getClienteId());
        reserva.setFechaHoraInicio(dto.getFechaHoraInicio());
        reserva.setFechaHoraFin(fin);
        reserva.setPrecioTotal(total);
        reserva.setEstado("PROGRAMADA");
        reserva.setNotas(dto.getNotas());
        asignarRecursos(reserva, dto.getFisioterapeutaId(), true);
        reserva = registrar(reserva);

        for (ServicioFeignDTO servicio : servicios) {
            ReservaServicio detalle = new ReservaServicio();
            detalle.setReserva(reserva);
            detalle.setServicioId(servicio.getId());
            detalle.setPrecioServicio(servicio.getPrecio());
            int duracion = servicio.getDuracionMinutos() == null || servicio.getDuracionMinutos() <= 0
                    ? 45 : servicio.getDuracionMinutos();
            detalle.setDuracionMinutos(duracion);
            detalleRepo.save(detalle);
        }
        return reserva;
    }

    private void validarHorarioAtencion(LocalDateTime inicio, LocalDateTime fin) {
        if (!inicio.toLocalDate().equals(fin.toLocalDate()))
            throw new BusinessException("La reserva debe terminar el mismo día");
        if (inicio.getDayOfWeek() == DayOfWeek.SUNDAY)
            throw new BusinessException("Los domingos la clínica no atiende");

        LocalTime i = inicio.toLocalTime();
        LocalTime f = fin.toLocalTime();
        boolean manana = !i.isBefore(LocalTime.of(7, 0)) && !f.isAfter(LocalTime.of(12, 0));
        boolean tarde = !i.isBefore(LocalTime.of(14, 0)) && !f.isAfter(LocalTime.of(19, 0));
        if (!manana && !tarde)
            throw new BusinessException("La reserva no entra en el horario de atención (07:00-12:00 / 14:00-19:00)");
    }

    private void validarCruce(LocalDateTime inicio, LocalDateTime fin, Integer reservaIgnorada) {
        if (existeCruce(inicio, fin, reservaIgnorada))
            throw new BusinessException("El horario seleccionado ya está ocupado");
    }

    private void validarCrucePaciente(Integer clienteId, LocalDateTime inicio, LocalDateTime fin, Integer reservaIgnorada) {
        for (Reserva r : solapadas(inicio, fin, reservaIgnorada))
            if (r.getClienteId().equals(clienteId))
                throw new BusinessException("El paciente ya tiene otra cita en ese horario (reserva #" + r.getId() + ")");
    }

    // Reservas que ocupan agenda: todo menos canceladas, expiradas y retenciones de pago vencidas
    private List<Reserva> ocupantes() {
        LocalDateTime ahora = LocalDateTime.now();
        List<Reserva> lista = new ArrayList<>();
        for (Reserva r : repo.findByEstadoNotIn(List.of("CANCELADA", "EXPIRADA"))) {
            if ("PENDIENTE_PAGO".equals(r.getEstado()) && r.getExpiraEn() != null && r.getExpiraEn().isBefore(ahora)) continue;
            lista.add(r);
        }
        return lista;
    }

    private List<Reserva> solapadas(LocalDateTime inicio, LocalDateTime fin, Integer reservaIgnorada) {
        List<Reserva> resultado = new ArrayList<>();
        for (Reserva actual : ocupantes()) {
            if (reservaIgnorada != null && actual.getId().equals(reservaIgnorada)) continue;
            if (inicio.isBefore(actual.getFechaHoraFin()) && fin.isAfter(actual.getFechaHoraInicio())) resultado.add(actual);
        }
        return resultado;
    }

    // Citas simultáneas posibles = fisioterapeutas activos (limitado por salas si hay registradas)
    private int capacidad() {
        int fisios = fisioRepo.findByActivoTrueOrderById().size();
        int salas = salaRepo.findByActivoTrueOrderById().size();
        int cap = fisios;
        if (salas > 0) cap = cap == 0 ? salas : Math.min(cap, salas);
        return Math.max(1, cap);
    }

    // estricto=true: si el fisioterapeuta pedido está ocupado se rechaza; false: se busca otro libre
    public void asignarRecursos(Reserva reserva, Integer fisioPreferido, boolean estricto) {
        List<Reserva> cruces = solapadas(reserva.getFechaHoraInicio(), reserva.getFechaHoraFin(), reserva.getId());
        Set<Integer> fisiosOcupados = new HashSet<>();
        Set<Integer> salasOcupadas = new HashSet<>();
        for (Reserva r : cruces) {
            if (r.getFisioterapeutaId() != null) fisiosOcupados.add(r.getFisioterapeutaId());
            if (r.getSalaId() != null) salasOcupadas.add(r.getSalaId());
        }

        List<Fisioterapeuta> fisios = fisioRepo.findByActivoTrueOrderById();
        Integer fisioAsignado = null;
        if (fisioPreferido != null) {
            boolean activo = fisios.stream().anyMatch(f -> f.getId().equals(fisioPreferido));
            if (activo && !fisiosOcupados.contains(fisioPreferido)) fisioAsignado = fisioPreferido;
            else if (estricto) throw new BusinessException("El fisioterapeuta elegido no está disponible en ese horario");
        }
        if (fisioAsignado == null) {
            for (Fisioterapeuta f : fisios) if (!fisiosOcupados.contains(f.getId())) { fisioAsignado = f.getId(); break; }
            if (fisioAsignado == null && !fisios.isEmpty())
                throw new BusinessException("No hay fisioterapeutas libres en ese horario");
        }

        List<Sala> salas = salaRepo.findByActivoTrueOrderById();
        Integer salaAsignada = null;
        if (reserva.getSalaId() != null && !salasOcupadas.contains(reserva.getSalaId())
                && salas.stream().anyMatch(s -> s.getId().equals(reserva.getSalaId())))
            salaAsignada = reserva.getSalaId();
        if (salaAsignada == null) {
            for (Sala s : salas) if (!salasOcupadas.contains(s.getId())) { salaAsignada = s.getId(); break; }
            if (salaAsignada == null && !salas.isEmpty())
                throw new BusinessException("No hay salas libres en ese horario");
        }

        reserva.setFisioterapeutaId(fisioAsignado);
        reserva.setSalaId(salaAsignada);
    }

    public DisponibilidadDTO disponibilidad(LocalDate fecha, List<Integer> servicioIds) {
        List<ServicioFeignDTO> servicios = cargarServicios(servicioIds);
        int duracion = calcularDuracion(servicios);
        List<SlotDTO> slots = new ArrayList<>();
        crearSlotsSegmento(fecha, LocalTime.of(7, 0), LocalTime.of(12, 0), duracion, slots);
        crearSlotsSegmento(fecha, LocalTime.of(14, 0), LocalTime.of(19, 0), duracion, slots);
        return new DisponibilidadDTO(duracion, slots);
    }

    private void crearSlotsSegmento(LocalDate fecha, LocalTime inicioTurno, LocalTime finTurno,
            int duracion, List<SlotDTO> slots) {
        LocalTime cursor = inicioTurno;
        DateTimeFormatter formato = DateTimeFormatter.ofPattern("HH:mm");
        while (cursor.isBefore(finTurno)) {
            LocalDateTime inicio = LocalDateTime.of(fecha, cursor);
            LocalDateTime fin = inicio.plusMinutes(duracion);
            boolean cabe = !fin.toLocalTime().isAfter(finTurno) && inicio.toLocalDate().equals(fin.toLocalDate());
            boolean pasado = inicio.isBefore(LocalDateTime.now());
            boolean domingo = fecha.getDayOfWeek() == DayOfWeek.SUNDAY;
            boolean libre = cabe && !pasado && !domingo && !existeCruce(inicio, fin, null);
            String motivo = null;
            if (domingo) motivo = "Domingo: la clínica no atiende";
            else if (!cabe) motivo = "No alcanza el tiempo en este turno";
            else if (pasado) motivo = "Hora pasada";
            else if (!libre) motivo = "Hora ocupada";
            slots.add(new SlotDTO(cursor.format(formato), libre, motivo));
            cursor = cursor.plusMinutes(PASO_MINUTOS);
        }
    }

    private boolean existeCruce(LocalDateTime inicio, LocalDateTime fin, Integer reservaIgnorada) {
        return solapadas(inicio, fin, reservaIgnorada).size() >= capacidad();
    }

    public List<Reserva> listarPorCliente(Integer clienteId) {
        return repo.findByClienteIdOrderByFechaHoraInicioDesc(clienteId);
    }

    public List<ReservaServicio> listarServicios(Integer reservaId) {
        return detalleRepo.findByReservaId(reservaId);
    }

    public String obtenerNombreServicio(Integer servicioId) {
        ApiResponse<ServicioFeignDTO> respuesta = catalogoFeign.buscarServicio(servicioId);
        if (respuesta == null || respuesta.getData() == null) return null;
        return respuesta.getData().getNombre();
    }

    // ═══════════════ COMPRA ONLINE: carrito → reserva temporal → pago ═══════════════
    public static final int MAX_SESIONES_POR_COMPRA = 4;
    public static final int MAX_CITAS_ACTIVAS = 4;
    public static final int MINUTOS_PARA_PAGAR = 10;
    public static final int DIAS_DE_ANTICIPACION = 30;

    private static final String ALFANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final java.security.SecureRandom aleatorio = new java.security.SecureRandom();

    private String nuevoCodigoOrden() {
        StringBuilder sb = new StringBuilder("FM-").append(LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"))).append('-');
        for (int i = 0; i < 5; i++) sb.append(ALFANUM.charAt(aleatorio.nextInt(ALFANUM.length())));
        return sb.toString();
    }

    private boolean activa(Reserva r, LocalDateTime ahora) {
        if ("PENDIENTE_PAGO".equals(r.getEstado())) return r.getExpiraEn() != null && r.getExpiraEn().isAfter(ahora);
        return ("PROGRAMADA".equals(r.getEstado()) || "EN_ATENCION".equals(r.getEstado())) && r.getFechaHoraFin().isAfter(ahora);
    }

    // Bloquea los horarios elegidos durante MINUTOS_PARA_PAGAR; si no se paga, se liberan solos
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public List<Reserva> checkout(CheckoutDTO dto) throws Exception {
        ApiResponse<Boolean> cliente = usuariosFeign.existeCliente(dto.getClienteId());
        if (cliente == null || !Boolean.TRUE.equals(cliente.getData()))
            throw new BusinessException("El cliente no existe");

        List<SesionDTO> sesiones = dto.getSesiones();
        if (sesiones.size() > MAX_SESIONES_POR_COMPRA)
            throw new BusinessException("Máximo " + MAX_SESIONES_POR_COMPRA + " sesiones por compra");

        // Si el paciente tenía otra compra sin pagar, se libera antes de crear la nueva
        LocalDateTime ahora = LocalDateTime.now();
        for (Reserva r : repo.findByClienteIdAndEstado(dto.getClienteId(), "PENDIENTE_PAGO")) {
            r.setEstado("EXPIRADA");
            r.setNotas("Reemplazada por una nueva compra");
            repo.save(r);
        }

        List<Reserva> previas = repo.findByClienteIdOrderByFechaHoraInicioDesc(dto.getClienteId());
        long activas = previas.stream().filter(r -> activa(r, ahora)).count();
        if (activas + sesiones.size() > MAX_CITAS_ACTIVAS)
            throw new BusinessException("Puedes tener como máximo " + MAX_CITAS_ACTIVAS + " citas activas. Ya tienes "
                    + activas + "; asiste a alguna antes de reservar más.");

        Set<LocalDate> dias = new HashSet<>();
        for (Reserva r : previas) if (activa(r, ahora)) dias.add(r.getFechaHoraInicio().toLocalDate());

        String codigo = nuevoCodigoOrden();
        LocalDateTime expira = ahora.plusMinutes(MINUTOS_PARA_PAGAR);
        LocalDate limite = LocalDate.now().plusDays(DIAS_DE_ANTICIPACION);
        List<Reserva> creadas = new ArrayList<>();

        for (int i = 0; i < sesiones.size(); i++) {
            SesionDTO s = sesiones.get(i);
            String etiqueta = "Sesión " + (i + 1) + ": ";
            LocalDateTime inicio = s.getFechaHoraInicio();
            if (inicio.isBefore(ahora)) throw new BusinessException(etiqueta + "la fecha ya pasó");
            if (inicio.toLocalDate().isAfter(limite))
                throw new BusinessException(etiqueta + "solo se reserva con hasta " + DIAS_DE_ANTICIPACION + " días de anticipación");
            if (!dias.add(inicio.toLocalDate()))
                throw new BusinessException(etiqueta + "solo se permite una sesión por día (" + inicio.toLocalDate() + ")");

            List<ServicioFeignDTO> servicio = cargarServicios(List.of(s.getServicioId()));
            LocalDateTime fin = inicio.plusMinutes(calcularDuracion(servicio));
            try {
                validarHorarioAtencion(inicio, fin);
                validarCruce(inicio, fin, null);
            } catch (BusinessException e) {
                throw new BusinessException(etiqueta + e.getMessage());
            }

            Reserva reserva = new Reserva();
            reserva.setClienteId(dto.getClienteId());
            reserva.setFechaHoraInicio(inicio);
            reserva.setFechaHoraFin(fin);
            reserva.setPrecioTotal(calcularTotal(servicio));
            reserva.setEstado("PENDIENTE_PAGO");
            reserva.setNotas(dto.getNotas());
            reserva.setOrdenCodigo(codigo);
            reserva.setExpiraEn(expira);
            asignarRecursos(reserva, null, true);
            reserva = repo.save(reserva);

            ReservaServicio detalle = new ReservaServicio();
            detalle.setReserva(reserva);
            detalle.setServicioId(servicio.get(0).getId());
            detalle.setPrecioServicio(servicio.get(0).getPrecio());
            detalle.setDuracionMinutos(calcularDuracion(servicio));
            detalleRepo.save(detalle);
            creadas.add(reserva);
        }
        return creadas;
    }

    public List<Reserva> orden(String codigo) {
        List<Reserva> lista = repo.findByOrdenCodigoOrderByFechaHoraInicio(codigo);
        if (lista.isEmpty()) throw new ModeloNotFoundException("La orden " + codigo + " no existe");
        return lista;
    }

    public static String estadoOrden(List<Reserva> reservas) {
        if (reservas.stream().anyMatch(r -> "PENDIENTE_PAGO".equals(r.getEstado()))) return "PENDIENTE_PAGO";
        if (reservas.stream().allMatch(r -> "EXPIRADA".equals(r.getEstado()))) return "EXPIRADA";
        if (reservas.stream().anyMatch(r -> r.getFechaPago() != null)) return "PAGADA";
        return "CANCELADA";
    }

    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public List<Reserva> pagar(String codigo, PagoDTO pago) {
        List<Reserva> reservas = orden(codigo);
        LocalDateTime ahora = LocalDateTime.now();
        if (reservas.stream().anyMatch(r -> r.getFechaPago() != null))
            throw new BusinessException("Esta orden ya fue pagada");
        boolean vencida = reservas.stream().anyMatch(r -> !"PENDIENTE_PAGO".equals(r.getEstado())
                || r.getExpiraEn() == null || r.getExpiraEn().isBefore(ahora));
        if (vencida) {
            expirar(reservas, "Tiempo de pago agotado");
            throw new BusinessException("Se agotó el tiempo para pagar y los horarios se liberaron. Vuelve a elegirlos.");
        }

        String metodo = pago.getMetodo().trim().toUpperCase();
        String referencia;
        switch (metodo) {
            case "TARJETA" -> {
                if (pago.getUltimos4() == null || !pago.getUltimos4().matches("\\d{4}"))
                    throw new BusinessException("Datos de tarjeta incompletos");
                if (pago.getTitular() == null || pago.getTitular().isBlank())
                    throw new BusinessException("Ingresa el nombre del titular");
                if ("0002".equals(pago.getUltimos4()))
                    throw new BusinessException("Pago rechazado por el banco emisor. Prueba con otra tarjeta.");
                String marca = pago.getMarca() == null || pago.getMarca().isBlank() ? "Tarjeta" : pago.getMarca();
                referencia = marca + " •••• " + pago.getUltimos4();
            }
            case "YAPE", "PLIN" -> {
                if (pago.getTelefono() == null || !pago.getTelefono().matches("9\\d{8}"))
                    throw new BusinessException("El celular debe tener 9 dígitos y empezar con 9");
                if (pago.getCodigoAprobacion() == null || !pago.getCodigoAprobacion().matches("\\d{6}"))
                    throw new BusinessException("El código de aprobación tiene 6 dígitos");
                if ("000000".equals(pago.getCodigoAprobacion()))
                    throw new BusinessException("Código de aprobación inválido o vencido");
                referencia = (metodo.equals("YAPE") ? "Yape" : "Plin") + " ••• " + pago.getTelefono().substring(6)
                        + " · Op. " + pago.getCodigoAprobacion();
            }
            default -> throw new BusinessException("Método de pago no soportado");
        }

        for (Reserva r : reservas) {
            r.setEstado("PROGRAMADA");
            r.setMetodoPago(metodo);
            r.setPagoReferencia(referencia);
            r.setFechaPago(ahora);
            r.setExpiraEn(null);
            repo.save(r);
        }
        return reservas;
    }

    public List<Reserva> cancelarOrden(String codigo) {
        List<Reserva> reservas = orden(codigo);
        if (reservas.stream().anyMatch(r -> r.getFechaPago() != null))
            throw new BusinessException("Una orden pagada se cancela cita por cita desde \"Mis citas\"");
        expirar(reservas, "Compra cancelada por el paciente");
        return reservas;
    }

    private void expirar(List<Reserva> reservas, String motivo) {
        for (Reserva r : reservas) {
            if (!"PENDIENTE_PAGO".equals(r.getEstado())) continue;
            r.setEstado("EXPIRADA");
            r.setNotas(motivo);
            r.setExpiraEn(null);
            repo.save(r);
        }
    }

    // Cada 30 s libera los horarios retenidos cuyo tiempo de pago venció
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 30_000)
    public void liberarRetencionesVencidas() {
        List<Reserva> vencidas = repo.findByEstadoAndExpiraEnBefore("PENDIENTE_PAGO", LocalDateTime.now());
        expirar(vencidas, "Tiempo de pago agotado");
    }

    public Reserva cancelar(Integer id, String motivo) throws Exception {
        Reserva reserva = buscar(id);
        if ("PENDIENTE_PAGO".equals(reserva.getEstado())) {
            expirar(List.of(reserva), "Compra cancelada por el paciente");
            return reserva;
        }
        if ("EXPIRADA".equals(reserva.getEstado()))
            throw new BusinessException("Esta reserva ya no está vigente");
        if ("CANCELADA".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("La reserva ya está cancelada");
        if ("ATENDIDA".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("Una reserva atendida no puede cancelarse");
        if ("EN_ATENCION".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("El paciente ya está en atención; finaliza la sesión en lugar de cancelarla");
        reserva.setEstado("CANCELADA");
        if (motivo != null && !motivo.isBlank()) {
            String previas = reserva.getNotas() == null || reserva.getNotas().isBlank() ? "" : reserva.getNotas() + " | ";
            String nota = previas + "Cancelada: " + motivo.trim();
            reserva.setNotas(nota.length() > 500 ? nota.substring(0, 500) : nota);
        }
        return actualizar(reserva);
    }

    public Reserva checkin(Integer id) throws Exception {
        Reserva reserva = buscar(id);
        if (!"PROGRAMADA".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("Solo se puede registrar la llegada de una cita programada");
        if (!reserva.getFechaHoraInicio().toLocalDate().equals(LocalDate.now()))
            throw new BusinessException("La llegada solo se registra el día de la cita");
        reserva.setHoraLlegada(LocalDateTime.now());
        reserva.setEstado("EN_ATENCION");
        return actualizar(reserva);
    }

    public Reserva reasignar(Integer id, ReasignarDTO dto) throws Exception {
        Reserva reserva = buscar(id);
        if (!"PROGRAMADA".equalsIgnoreCase(reserva.getEstado()) && !"EN_ATENCION".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("Solo se reasignan citas programadas o en atención");
        if (dto.getFisioterapeutaId() == null && dto.getSalaId() == null)
            throw new BusinessException("Indica el nuevo fisioterapeuta o la nueva sala");

        List<Reserva> cruces = solapadas(reserva.getFechaHoraInicio(), reserva.getFechaHoraFin(), id);
        if (dto.getFisioterapeutaId() != null) {
            Fisioterapeuta f = fisioRepo.findById(dto.getFisioterapeutaId())
                    .orElseThrow(() -> new BusinessException("El fisioterapeuta no existe"));
            if (!Boolean.TRUE.equals(f.getActivo())) throw new BusinessException(f.getNombre() + " está inactivo");
            for (Reserva r : cruces)
                if (f.getId().equals(r.getFisioterapeutaId()))
                    throw new BusinessException(f.getNombre() + " ya tiene otra cita en ese horario (reserva #" + r.getId() + ")");
            reserva.setFisioterapeutaId(f.getId());
        }
        if (dto.getSalaId() != null) {
            Sala s = salaRepo.findById(dto.getSalaId())
                    .orElseThrow(() -> new BusinessException("La sala no existe"));
            if (!Boolean.TRUE.equals(s.getActivo())) throw new BusinessException(s.getNombre() + " está inactiva");
            for (Reserva r : cruces)
                if (s.getId().equals(r.getSalaId()))
                    throw new BusinessException(s.getNombre() + " está ocupada en ese horario (reserva #" + r.getId() + ")");
            reserva.setSalaId(s.getId());
        }
        return actualizar(reserva);
    }

    public Reserva reprogramar(Integer id, LocalDateTime nuevoInicio) throws Exception {
        Reserva reserva = buscar(id);
        if (!"PROGRAMADA".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("Solo se puede reprogramar una reserva programada");
        if (nuevoInicio.isBefore(LocalDateTime.now()))
            throw new BusinessException("No se puede reprogramar a una fecha pasada");

        int minutos = 0;
        for (ReservaServicio detalle : detalleRepo.findByReservaId(id)) minutos += detalle.getDuracionMinutos();
        LocalDateTime nuevoFin = nuevoInicio.plusMinutes(minutos);
        validarHorarioAtencion(nuevoInicio, nuevoFin);
        validarCruce(nuevoInicio, nuevoFin, id);
        validarCrucePaciente(reserva.getClienteId(), nuevoInicio, nuevoFin, id);
        reserva.setFechaHoraInicio(nuevoInicio);
        reserva.setFechaHoraFin(nuevoFin);
        asignarRecursos(reserva, reserva.getFisioterapeutaId(), false);
        return actualizar(reserva);
    }

    public Reserva marcarAtendida(Integer id) throws Exception {
        Reserva reserva = buscar(id);
        if ("CANCELADA".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("Una reserva cancelada no puede marcarse como atendida");
        if ("ATENDIDA".equalsIgnoreCase(reserva.getEstado()))
            throw new BusinessException("La reserva ya fue atendida");
        if ("PENDIENTE_PAGO".equals(reserva.getEstado()) || "EXPIRADA".equals(reserva.getEstado()))
            throw new BusinessException("La reserva no está confirmada: falta el pago");
        reserva.setEstado("ATENDIDA");
        return actualizar(reserva);
    }

    public DashboardDTO dashboard(LocalDate desde, LocalDate hasta) {
        LocalDate hoy = LocalDate.now();
        LocalDate inicio = desde == null ? hoy.withDayOfMonth(1) : desde;
        LocalDate finIncluido = hasta == null ? inicio.plusMonths(1).minusDays(1) : hasta;
        LocalDateTime desdeHora = inicio.atStartOfDay();
        LocalDateTime hastaHora = finIncluido.plusDays(1).atStartOfDay();

        // Las retenciones de pago (pendientes o vencidas) no son citas reales todavía
        List<Reserva> reservas = repo.findByFechaHoraInicioBetweenOrderByFechaHoraInicio(desdeHora, hastaHora).stream()
                .filter(r -> !"PENDIENTE_PAGO".equals(r.getEstado()) && !"EXPIRADA".equals(r.getEstado()))
                .toList();
        int programadas = 0, atendidas = 0, canceladas = 0, enAtencion = 0;
        Map<String, Integer> porDia = new LinkedHashMap<>();
        Map<Integer, Integer> usoServicios = new HashMap<>();

        for (Reserva r : reservas) {
            if ("PROGRAMADA".equalsIgnoreCase(r.getEstado())) programadas++;
            else if ("ATENDIDA".equalsIgnoreCase(r.getEstado())) atendidas++;
            else if ("CANCELADA".equalsIgnoreCase(r.getEstado())) canceladas++;
            else if ("EN_ATENCION".equalsIgnoreCase(r.getEstado())) enAtencion++;

            String dia = r.getFechaHoraInicio().toLocalDate().format(DateTimeFormatter.ofPattern("dd/MM"));
            porDia.put(dia, porDia.getOrDefault(dia, 0) + 1);

            for (ReservaServicio detalle : detalleRepo.findByReservaId(r.getId())) {
                Integer sid = detalle.getServicioId();
                usoServicios.put(sid, usoServicios.getOrDefault(sid, 0) + 1);
            }
        }

        List<ChartPointDTO> puntosDia = new ArrayList<>();
        for (Map.Entry<String,Integer> e : porDia.entrySet()) puntosDia.add(new ChartPointDTO(e.getKey(), e.getValue()));

        List<Map.Entry<Integer,Integer>> orden = new ArrayList<>(usoServicios.entrySet());
        orden.sort((a,b) -> b.getValue().compareTo(a.getValue()));
        List<ChartPointDTO> top = new ArrayList<>();
        int limite = Math.min(5, orden.size());
        for (int i = 0; i < limite; i++) {
            Map.Entry<Integer,Integer> e = orden.get(i);
            String nombre = obtenerNombreServicio(e.getKey());
            top.add(new ChartPointDTO(nombre == null ? "Servicio " + e.getKey() : nombre, e.getValue()));
        }

        LocalDateTime ahora = LocalDateTime.now();
        List<Reserva> proximas = repo.findByFechaHoraInicioBetweenOrderByFechaHoraInicio(ahora, ahora.plusHours(24));
        List<ReservaDTO> proximasDTO = new ArrayList<>();
        for (Reserva r : proximas) if (esCitaReal(r) && !"CANCELADA".equals(r.getEstado())) proximasDTO.add(convertirBasico(r));

        int total = reservas.size();
        double tasa = total == 0 ? 0.0 : (canceladas * 100.0 / total);
        tasa = Math.round(tasa * 100.0) / 100.0;
        int citasHoy = 0;
        for (Reserva r : repo.findByFechaHoraInicioBetweenOrderByFechaHoraInicio(hoy.atStartOfDay(), hoy.plusDays(1).atStartOfDay()))
            if (esCitaReal(r) && !"CANCELADA".equals(r.getEstado())) citasHoy++;

        // Paciente activo: tiene alguna cita no cancelada en los últimos 90 días o agendada a futuro
        Set<Integer> activos = new HashSet<>();
        for (Reserva r : repo.findByFechaHoraInicioAfter(ahora.minusDays(90)))
            if (esCitaReal(r) && !"CANCELADA".equals(r.getEstado())) activos.add(r.getClienteId());

        return new DashboardDTO(total, programadas, atendidas, canceladas, tasa, puntosDia, top, proximasDTO,
                enAtencion, citasHoy, activos.size());
    }

    private static boolean esCitaReal(Reserva r) {
        return !"PENDIENTE_PAGO".equals(r.getEstado()) && !"EXPIRADA".equals(r.getEstado());
    }

    private ReservaDTO convertirBasico(Reserva reserva) {
        ReservaDTO dto = new ReservaDTO();
        dto.setId(reserva.getId());
        dto.setClienteId(reserva.getClienteId());
        dto.setFechaHoraInicio(reserva.getFechaHoraInicio());
        dto.setFechaHoraFin(reserva.getFechaHoraFin());
        dto.setPrecioTotal(reserva.getPrecioTotal());
        dto.setEstado(reserva.getEstado());
        dto.setNotas(reserva.getNotas());
        dto.setFechaCreacion(reserva.getFechaCreacion());
        dto.setFisioterapeutaId(reserva.getFisioterapeutaId());
        dto.setSalaId(reserva.getSalaId());
        dto.setHoraLlegada(reserva.getHoraLlegada());
        dto.setOrdenCodigo(reserva.getOrdenCodigo());
        dto.setMetodoPago(reserva.getMetodoPago());
        dto.setPagoReferencia(reserva.getPagoReferencia());
        dto.setFechaPago(reserva.getFechaPago());
        dto.setExpiraEn(reserva.getExpiraEn());
        return dto;
    }
}
