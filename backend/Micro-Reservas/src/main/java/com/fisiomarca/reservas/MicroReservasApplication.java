package com.fisiomarca.reservas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableFeignClients
@EnableScheduling
@EnableDiscoveryClient
@SpringBootApplication
public class MicroReservasApplication {
    public static void main(String[] args) { SpringApplication.run(MicroReservasApplication.class, args); }
}
