package com.anthinh.pricecalculator.dto;

import com.anthinh.pricecalculator.model.WindingType;
import lombok.Data;

@Data
public class WindingUsageRequest {
    private Long windingSpecId;
    private WindingType type;
    private Double weightKg;
}
