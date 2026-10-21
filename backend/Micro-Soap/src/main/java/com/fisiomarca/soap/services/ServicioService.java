package com.fisiomarca.soap.services;

import org.springframework.stereotype.Service;

import com.fisiomarca.soap.GetServicioResponse;
import com.fisiomarca.soap.GetServiciosResponse;
import com.fisiomarca.soap.PostServicioResponse;
import com.fisiomarca.soap.Servicio;
import com.fisiomarca.soap.repository.ServicioRepository;

/**
 * Logica del servicio SOAP. Arma las respuestas que viajan como XML.
 */
@Service
public class ServicioService {

    private final ServicioRepository repo;

    public ServicioService(ServicioRepository repo) {
        this.repo = repo;
    }

    public GetServiciosResponse listaServicios() {
        GetServiciosResponse response = new GetServiciosResponse();
        response.getLista().addAll(repo.listServicios());
        return response;
    }

    public GetServicioResponse buscarServicio(int id) {
        GetServicioResponse response = new GetServicioResponse();
        response.setBean(repo.findServicio(id));
        return response;
    }

    public PostServicioResponse saveServicio(Servicio bean) {
        PostServicioResponse response = new PostServicioResponse();
        response.setEstado(repo.saveServicio(bean));
        return response;
    }
}
