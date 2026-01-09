package com.anthinh.pricecalculator.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class RoundCoreUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "transformer_id", nullable = false, unique = true)
    private Transformer transformer;

    @Column(nullable = false)
    private Double weightKg;

    @Column(nullable = false)
    private Double pricePerKg;

    @Column(nullable = false)
    private Double cost;
}
