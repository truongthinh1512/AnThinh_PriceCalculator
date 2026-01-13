package com.anthinh.pricecalculator.dto;

import com.anthinh.pricecalculator.model.WindingMaterial;
import com.anthinh.pricecalculator.model.WindingType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WindingSpecDto {
    private Long id;
    private String name;
    private String description;
    private WindingType type;
    private WindingMaterial material;
    private Double diameter;
    private Double pricePerKg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
