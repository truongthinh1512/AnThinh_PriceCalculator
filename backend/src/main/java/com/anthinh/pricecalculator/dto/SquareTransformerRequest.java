package com.anthinh.pricecalculator.dto;

import lombok.Data;
import java.util.List;

@Data
public class SquareTransformerRequest {
    private String name;
    private String model3dUrl;
    private String drawingConfig;
    private Long customerId;
    private Long eiLaminationId;
    private Long eiCoreId;
    private Double laminationWeightKg;
    private List<WindingUsageRequest> windings;
    private List<AccessoryUsageRequest> accessories;
}
