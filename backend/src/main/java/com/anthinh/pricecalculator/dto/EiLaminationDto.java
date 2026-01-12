package com.anthinh.pricecalculator.dto;

import lombok.Data;

@Data
public class EiLaminationDto {
    private Long id;
    private String name;
    private String description;
    private Double pricePerKg; // Phe price

    // Core info
    private Long coreId;
    private String coreName; // Optional, defaults to name
    private String coreDescription; // Optional
    private Double corePrice; // Core price per unit
}
