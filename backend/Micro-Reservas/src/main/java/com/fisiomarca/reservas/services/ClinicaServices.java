package com.fisiomarca.reservas.services;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import com.fisiomarca.reservas.entity.*;
import com.fisiomarca.reservas.repository.*;
import com.fisiomarca.reservas.utils.*;

@Service
public class ClinicaServices {
    private final FisioterapeutaRepository fisioRepo;
    private final SalaRepository salaRepo;
    private final NotaClinicaRepository notaRepo;

    public ClinicaServices(FisioterapeutaRepository fisioRepo, SalaRepository salaRepo, NotaClinicaRepository notaRepo) {
        this.fisioRepo = fisioRepo;
        this.salaRepo = salaRepo;
        this.notaRepo = notaRepo;
    }

    public List<Fisioterapeuta> listarFisioterapeutas() { return fisioRepo.findAll(); }

    public Fisioterapeuta guardarFisioterapeuta(Integer id, Fisioterapeuta datos) {
        if (datos.getNombre() == null || datos.getNombre().isBlank())
            throw new BusinessException("El nombre del fisioterapeuta es obligatorio");
        Fisioterapeuta f = id == null ? new Fisioterapeuta() : fisioRepo.findById(id)
                .orElseThrow(() -> new ModeloNotFoundException("Fisioterapeuta " + id + " no existe"));
        f.setNombre(datos.getNombre().trim());
        f.setEspecialidad(datos.getEspecialidad());
        if (datos.getColor() != null) f.setColor(datos.getColor());
        if (datos.getActivo() != null) f.setActivo(datos.getActivo());
        return fisioRepo.save(f);
    }

    public List<Sala> listarSalas() { return salaRepo.findAll(); }

    public Sala guardarSala(Integer id, Sala datos) {
        if (datos.getNombre() == null || datos.getNombre().isBlank())
            throw new BusinessException("El nombre de la sala es obligatorio");
        Sala s = id == null ? new Sala() : salaRepo.findById(id)
                .orElseThrow(() -> new ModeloNotFoundException("Sala " + id + " no existe"));
        s.setNombre(datos.getNombre().trim());
        s.setTipo(datos.getTipo());
        if (datos.getActivo() != null) s.setActivo(datos.getActivo());
        return salaRepo.save(s);
    }

    public List<NotaClinica> historial(Integer clienteId) { return notaRepo.findByClienteIdOrderByFechaDesc(clienteId); }

    public NotaClinica registrarNota(NotaClinica nota) {
        if (nota.getClienteId() == null) throw new BusinessException("Falta el paciente");
        if (nota.getMotivo() == null || nota.getMotivo().isBlank()) throw new BusinessException("El motivo es obligatorio");
        if (nota.getNivelDolor() != null && (nota.getNivelDolor() < 0 || nota.getNivelDolor() > 10))
            throw new BusinessException("El nivel de dolor debe estar entre 0 y 10");
        nota.setId(null);
        if (nota.getFecha() == null) nota.setFecha(LocalDateTime.now());
        return notaRepo.save(nota);
    }
}
