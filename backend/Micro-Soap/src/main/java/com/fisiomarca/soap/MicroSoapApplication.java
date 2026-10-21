package com.fisiomarca.soap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * MICRO-SOAP: expone el catalogo de servicios de FisioMarca por SOAP (Spring Web Services).
 * Se registra en Eureka como MICRO-SOAP y publica el WSDL en /ws/servicio.wsdl.
 */
@EnableDiscoveryClient
@SpringBootApplication
public class MicroSoapApplication {
    public static void main(String[] args) {
        SpringApplication.run(MicroSoapApplication.class, args);
    }
}
