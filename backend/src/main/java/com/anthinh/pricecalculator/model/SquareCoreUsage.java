package com.anthinh.pricecalculator.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class SquareCoreUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "transformer_id", nullable = false, unique = true)
    private Transformer transformer;

    @ManyToOne
    @JoinColumn(name = "lamination_id", nullable = false)
    private EiLamination lamination;

    @ManyToOne
    @JoinColumn(name = "ei_core_id", nullable = false)
    private EiCore eiCore;

    @Column(nullable = false)
    private Double laminationWeightKg;

    @Column(nullable = false)
    private Double laminationCost; // laminationWeightKg * lamination.pricePerKg

    @Column(nullable = false)
    private Double corePrice; // eiCore.price

    @Column(nullable = false)
    private Double cost; // laminationCost + corePrice
}
