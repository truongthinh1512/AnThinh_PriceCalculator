package com.anthinh.pricecalculator.dto;

import lombok.Data;

@Data
public class AccessoryUsageRequest {
    private Long accessoryId;
    private Double quantity;
}
