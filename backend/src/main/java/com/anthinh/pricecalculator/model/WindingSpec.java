package com.anthinh.pricecalculator.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class WindingSpec extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WindingType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WindingMaterial material;

    @Column(nullable = false)
    private Double diameter;

    @Column(nullable = false)
    private Double pricePerKg;
}
