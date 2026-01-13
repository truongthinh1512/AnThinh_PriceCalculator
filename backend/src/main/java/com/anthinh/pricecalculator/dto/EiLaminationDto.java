package com.anthinh.pricecalculator.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
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

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
