package com.anthinh.pricecalculator.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class TransformerWinding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;

    @ManyToOne
    @JoinColumn(name = "winding_spec_id", nullable = false)
    private WindingSpec windingSpec;

    @Column(nullable = false)
    private Double weightKg;

    @Column(nullable = false)
    private Double cost;
}
