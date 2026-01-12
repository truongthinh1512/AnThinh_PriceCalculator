package com.anthinh.pricecalculator.dto;

import lombok.Data;

@Data
public class WindingUsageRequest {
    private Long windingSpecId;
    private Double weightKg;
}
