package com.anthinh.pricecalculator.dto;

import com.anthinh.pricecalculator.model.AccessoryType;
import com.anthinh.pricecalculator.model.MaterialUnitType;
import lombok.Data;

@Data
public class AccessoryDto {
    private Long id;
    private AccessoryType type;
    private String name;
    private String description;
    private MaterialUnitType unitType;
    private Double unitPrice;
}
