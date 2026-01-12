package com.anthinh.pricecalculator.dto;

import com.anthinh.pricecalculator.model.WindingMaterial;
import com.anthinh.pricecalculator.model.WindingType;
import lombok.Data;

@Data
public class WindingSpecDto {
    private Long id;
    private String name;
    private String description;
    private WindingType type;
    private WindingMaterial material;
    private Double diameter;
    private Double pricePerKg;
}
