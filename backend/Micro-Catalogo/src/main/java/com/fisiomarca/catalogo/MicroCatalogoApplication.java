package com.fisiomarca.catalogo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class MicroCatalogoApplication {
    public static void main(String[] args) {
        SpringApplication.run(MicroCatalogoApplication.class, args);
    }
}
