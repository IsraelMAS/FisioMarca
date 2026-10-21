package com.fisiomarca.soap.endpoint;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import com.fisiomarca.soap.GetServicioRequest;
import com.fisiomarca.soap.GetServicioResponse;
import com.fisiomarca.soap.GetServiciosRequest;
import com.fisiomarca.soap.GetServiciosResponse;
import com.fisiomarca.soap.PostServicioRequest;
import com.fisiomarca.soap.PostServicioResponse;
import com.fisiomarca.soap.services.ServicioService;

/**
 * Endpoint SOAP: recibe los mensajes XML definidos en servicio.xsd y delega en el servicio.
 */
@Endpoint
public class ServicioEndpoint {

    private static final String NAMESPACE = "http://fisiomarca.com/soap";

    private final ServicioService servicioService;

    public ServicioEndpoint(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "getServiciosRequest")
    @ResponsePayload
    public GetServiciosResponse listar(@RequestPayload GetServiciosRequest request) {
        return servicioService.listaServicios();
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "getServicioRequest")
    @ResponsePayload
    public GetServicioResponse buscar(@RequestPayload GetServicioRequest request) {
        return servicioService.buscarServicio(request.getId());
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "postServicioRequest")
    @ResponsePayload
    public PostServicioResponse grabar(@RequestPayload PostServicioRequest request) {
        return servicioService.saveServicio(request.getBean());
    }
}
