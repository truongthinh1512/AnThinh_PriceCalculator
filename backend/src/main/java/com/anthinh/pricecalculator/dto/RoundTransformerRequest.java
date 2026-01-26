package com.anthinh.pricecalculator.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoundTransformerRequest {
    private String name;
    private String model3dUrl;
    private String drawingConfig;
    private Long customerId;
    private Double coreWeightKg;
    private Double corePricePerKg;
    private List<WindingUsageRequest> windings;
    private List<AccessoryUsageRequest> accessories;
}
