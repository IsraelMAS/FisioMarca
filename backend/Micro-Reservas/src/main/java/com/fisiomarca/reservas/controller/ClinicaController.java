package com.fisiomarca.reservas.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import com.fisiomarca.reservas.entity.*;
import com.fisiomarca.reservas.security.AccesoCliente;
import com.fisiomarca.reservas.services.ClinicaServices;
import com.fisiomarca.reservas.utils.ApiResponse;

@RestController
@RequestMapping("/reservas")
public class ClinicaController {
    private final ClinicaServices services;

    public ClinicaController(ClinicaServices services) { this.services = services; }

    @GetMapping("/fisioterapeutas")
    public ResponseEntity<ApiResponse<?>> fisioterapeutas() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Fisioterapeutas", services.listarFisioterapeutas()));
    }

    @PostMapping("/fisioterapeutas")
    public ResponseEntity<ApiResponse<?>> crearFisioterapeuta(@RequestBody Fisioterapeuta f) {
        return new ResponseEntity<>(new ApiResponse<>(true, "Fisioterapeuta registrado", services.guardarFisioterapeuta(null, f)), HttpStatus.CREATED);
    }

    @PutMapping("/fisioterapeutas/{id}")
    public ResponseEntity<ApiResponse<?>> editarFisioterapeuta(@PathVariable Integer id, @RequestBody Fisioterapeuta f) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Fisioterapeuta actualizado", services.guardarFisioterapeuta(id, f)));
    }

    @GetMapping("/salas")
    public ResponseEntity<ApiResponse<?>> salas() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Salas", services.listarSalas()));
    }

    @PostMapping("/salas")
    public ResponseEntity<ApiResponse<?>> crearSala(@RequestBody Sala s) {
        return new ResponseEntity<>(new ApiResponse<>(true, "Sala registrada", services.guardarSala(null, s)), HttpStatus.CREATED);
    }

    @PutMapping("/salas/{id}")
    public ResponseEntity<ApiResponse<?>> editarSala(@PathVariable Integer id, @RequestBody Sala s) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Sala actualizada", services.guardarSala(id, s)));
    }

    @GetMapping("/historial/{clienteId}")
    public ResponseEntity<ApiResponse<?>> historial(@PathVariable Integer clienteId) {
        AccesoCliente.verificar(clienteId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Historial clínico", services.historial(clienteId)));
    }

    @PostMapping("/historial")
    public ResponseEntity<ApiResponse<?>> registrarNota(@RequestBody NotaClinica nota) {
        return new ResponseEntity<>(new ApiResponse<>(true, "Nota registrada", services.registrarNota(nota)), HttpStatus.CREATED);
    }
}
