package com.anthinh.pricecalculator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PricecalculatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(PricecalculatorApplication.class, args);
    }
}
