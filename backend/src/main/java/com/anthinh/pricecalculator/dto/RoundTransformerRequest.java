package com.anthinh.pricecalculator.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoundTransformerRequest {
    private String name;
    private String model3dUrl;
    private Double coreWeightKg;
    private Double corePricePerKg;
    private List<WindingUsageRequest> windings;
    private List<AccessoryUsageRequest> accessories;
}
