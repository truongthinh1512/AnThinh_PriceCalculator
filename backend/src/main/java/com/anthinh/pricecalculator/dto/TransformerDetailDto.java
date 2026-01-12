package com.anthinh.pricecalculator.dto;

import com.anthinh.pricecalculator.model.TransformerType;
import lombok.Data;
import java.util.List;

@Data
public class TransformerDetailDto {
    private Long id;
    private String name;
    private TransformerType type;
    private Double totalCost;
    private String model3dUrl;

    // Components
    private SquareCoreDto squareCore;
    private RoundCoreDto roundCore;
    private List<WindingUsageDto> windings;
    private List<AccessoryUsageDto> accessories;

    @Data
    public static class SquareCoreDto {
        private String laminationName;
        private Double laminationWeightKg;
        private Double laminationPricePerKg;
        private Double laminationCost;
        
        private String coreName;
        private Double corePrice; // Unit price
        private Double totalCost; // lamination + core
    }

    @Data
    public static class RoundCoreDto {
        private Double weightKg;
        private Double pricePerKg;
        private Double cost;
    }

    @Data
    public static class WindingUsageDto {
        private String specName;
        private String material; // Enum name
        private String type; // Enum name
        private Double diameter;
        private Double pricePerKg;
        private Double weightKg;
        private Double cost;
    }

    @Data
    public static class AccessoryUsageDto {
        private String accessoryName;
        private String type; // Enum name
        private String unitType; // Enum name
        private Double unitPrice;
        private Double quantity;
        private Double cost;
    }
}
