package com.fisiomarca.soap.config;

import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.ws.config.annotation.EnableWs;
import org.springframework.ws.transport.http.MessageDispatcherServlet;
import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;
import org.springframework.xml.xsd.XsdSchema;

/**
 * Configuracion SOAP (contract-first).
 * El WSDL se publica en: http://localhost:8098/ws/servicio.wsdl
 */
@EnableWs
@Configuration
public class WebServiceConfig {

    @Bean
    public ServletRegistrationBean<MessageDispatcherServlet> messageDispatcherServlet(ApplicationContext context) {
        MessageDispatcherServlet servlet = new MessageDispatcherServlet();
        servlet.setApplicationContext(context);
        servlet.setTransformWsdlLocations(true);
        return new ServletRegistrationBean<>(servlet, "/ws/*", "/ws");
    }

    @Bean(name = "servicio")
    public DefaultWsdl11Definition servicioWsdl(XsdSchema servicioSchema) {
        DefaultWsdl11Definition definition = new DefaultWsdl11Definition();
        definition.setPortTypeName("ServicioPort");
        definition.setTargetNamespace("http://fisiomarca.com/soap");
        definition.setLocationUri("/ws");
        definition.setSchema(servicioSchema);
        return definition;
    }

    @Bean
    public XsdSchema servicioSchema() {
        return new SimpleXsdSchema(new ClassPathResource("wsdl/servicio.xsd"));
    }
}
