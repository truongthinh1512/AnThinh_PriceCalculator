package com.anthinh.pricecalculator.dto;

import com.anthinh.pricecalculator.model.AccessoryType;
import com.anthinh.pricecalculator.model.MaterialUnitType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessoryDto {
    private Long id;
    private AccessoryType type;
    private String name;
    private String description;
    private MaterialUnitType unitType;
    private Double unitPrice;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
