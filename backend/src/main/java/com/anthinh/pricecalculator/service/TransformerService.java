package com.anthinh.pricecalculator.service;

import com.anthinh.pricecalculator.dto.*;
import com.anthinh.pricecalculator.model.*;
import com.anthinh.pricecalculator.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransformerService {

    private final TransformerRepository transformerRepository;
    private final EiLaminationRepository eiLaminationRepository;
    private final EiCoreRepository eiCoreRepository;
    private final SquareCoreUsageRepository squareCoreUsageRepository;
    private final RoundCoreUsageRepository roundCoreUsageRepository;
    private final WindingSpecRepository windingSpecRepository;
    private final TransformerWindingRepository transformerWindingRepository;
    private final AccessoryRepository accessoryRepository;
    private final TransformerAccessoryUsageRepository transformerAccessoryUsageRepository;

    @Transactional
    public TransformerDetailDto createSquareTransformer(SquareTransformerRequest request) {
        Transformer transformer = new Transformer();
        transformer.setName(request.getName());
        transformer.setType(TransformerType.VUONG);
        transformer.setModel3dUrl(request.getModel3dUrl());
        // Temporary save to get ID
        transformer.setTotalCost(0.0);
        transformer = transformerRepository.save(transformer);

        double totalCost = 0.0;

        // 1. Handle Core (Square)
        // Find Lamination
        EiLamination lamination = eiLaminationRepository.findById(request.getEiLaminationId())
                .orElseThrow(() -> new RuntimeException("EiLamination not found"));
        // Find matching Core (1-1)
        EiCore core = eiCoreRepository.findByLamination(lamination)
                .orElseThrow(() -> new RuntimeException("Associated EiCore not found for lamination " + lamination.getName()));

        SquareCoreUsage coreUsage = new SquareCoreUsage();
        coreUsage.setTransformer(transformer);
        coreUsage.setLamination(lamination);
        coreUsage.setEiCore(core);
        coreUsage.setLaminationWeightKg(request.getLaminationWeightKg());
        coreUsage.setLaminationCost(request.getLaminationWeightKg() * lamination.getPricePerKg());
        coreUsage.setCorePrice(core.getPrice());
        coreUsage.setCost(coreUsage.getLaminationCost() + coreUsage.getCorePrice());
        
        squareCoreUsageRepository.save(coreUsage);
        totalCost += coreUsage.getCost();

        // 2. Handle Windings
        if (request.getWindings() != null) {
            for (WindingUsageRequest wReq : request.getWindings()) {
                totalCost += addWindingUsage(transformer, wReq);
            }
        }

        // 3. Handle Accessories
        if (request.getAccessories() != null) {
            for (AccessoryUsageRequest aReq : request.getAccessories()) {
                totalCost += addAccessoryUsage(transformer, aReq);
            }
        }

        // Update total cost
        transformer.setTotalCost(totalCost);
        transformerRepository.save(transformer);

        return getTransformerDetails(transformer.getId());
    }

    @Transactional
    public TransformerDetailDto createRoundTransformer(RoundTransformerRequest request) {
        Transformer transformer = new Transformer();
        transformer.setName(request.getName());
        transformer.setType(TransformerType.TRON);
        transformer.setModel3dUrl(request.getModel3dUrl());
        transformer.setTotalCost(0.0);
        transformer = transformerRepository.save(transformer);

        double totalCost = 0.0;

        // 1. Handle Round Core
        RoundCoreUsage coreUsage = new RoundCoreUsage();
        coreUsage.setTransformer(transformer);
        coreUsage.setWeightKg(request.getCoreWeightKg());
        coreUsage.setPricePerKg(request.getCorePricePerKg());
        coreUsage.setCost(request.getCoreWeightKg() * request.getCorePricePerKg());
        
        roundCoreUsageRepository.save(coreUsage);
        totalCost += coreUsage.getCost();

        // 2. Handle Windings
        if (request.getWindings() != null) {
            for (WindingUsageRequest wReq : request.getWindings()) {
                totalCost += addWindingUsage(transformer, wReq);
            }
        }

        // 3. Handle Accessories
        if (request.getAccessories() != null) {
            for (AccessoryUsageRequest aReq : request.getAccessories()) {
                totalCost += addAccessoryUsage(transformer, aReq);
            }
        }

        transformer.setTotalCost(totalCost);
        transformerRepository.save(transformer);

        return getTransformerDetails(transformer.getId());
    }

    private double addWindingUsage(Transformer transformer, WindingUsageRequest req) {
        WindingSpec spec = windingSpecRepository.findById(req.getWindingSpecId())
                .orElseThrow(() -> new RuntimeException("WindingSpec not found"));
        
        TransformerWinding usage = new TransformerWinding();
        usage.setTransformer(transformer);
        usage.setWindingSpec(spec);
        usage.setWeightKg(req.getWeightKg());
        usage.setCost(req.getWeightKg() * spec.getPricePerKg());
        
        transformerWindingRepository.save(usage);
        return usage.getCost();
    }

    private double addAccessoryUsage(Transformer transformer, AccessoryUsageRequest req) {
        Accessory accessory = accessoryRepository.findById(req.getAccessoryId())
                .orElseThrow(() -> new RuntimeException("Accessory not found"));
        
        TransformerAccessoryUsage usage = new TransformerAccessoryUsage();
        usage.setTransformer(transformer);
        usage.setAccessory(accessory);
        usage.setQuantity(req.getQuantity());
        usage.setCost(req.getQuantity() * accessory.getUnitPrice());
        
        transformerAccessoryUsageRepository.save(usage);
        return usage.getCost();
    }

    @Transactional
    public void deleteTransformer(Long id) {
        Transformer transformer = transformerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transformer not found"));
        
        // Delete all usages first
        transformerWindingRepository.deleteAll(transformerWindingRepository.findByTransformer(transformer));
        transformerAccessoryUsageRepository.deleteAll(transformerAccessoryUsageRepository.findByTransformer(transformer));
        
        if (transformer.getType() == TransformerType.VUONG) {
            squareCoreUsageRepository.findByTransformer(transformer).ifPresent(squareCoreUsageRepository::delete);
        } else if (transformer.getType() == TransformerType.TRON) {
            roundCoreUsageRepository.findByTransformer(transformer).ifPresent(roundCoreUsageRepository::delete);
        }

        transformerRepository.delete(transformer);
    }

    public TransformerDetailDto getTransformerDetails(Long id) {
        Transformer t = transformerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transformer not found"));
        
        TransformerDetailDto dto = new TransformerDetailDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setType(t.getType());
        dto.setTotalCost(t.getTotalCost());
        dto.setModel3dUrl(t.getModel3dUrl());

        // Fill components
        if (t.getType() == TransformerType.VUONG) {
            squareCoreUsageRepository.findByTransformer(t)
                    .ifPresent(usage -> {
                        TransformerDetailDto.SquareCoreDto coreDto = new TransformerDetailDto.SquareCoreDto();
                        coreDto.setLaminationName(usage.getLamination().getName());
                        coreDto.setLaminationWeightKg(usage.getLaminationWeightKg());
                        coreDto.setLaminationPricePerKg(usage.getLamination().getPricePerKg());
                        coreDto.setLaminationCost(usage.getLaminationCost());
                        coreDto.setCoreName(usage.getEiCore().getName());
                        coreDto.setCorePrice(usage.getCorePrice());
                        coreDto.setTotalCost(usage.getCost());
                        dto.setSquareCore(coreDto);
                    });
        } else if (t.getType() == TransformerType.TRON) {
            roundCoreUsageRepository.findByTransformer(t)
                    .ifPresent(usage -> {
                        TransformerDetailDto.RoundCoreDto coreDto = new TransformerDetailDto.RoundCoreDto();
                        coreDto.setWeightKg(usage.getWeightKg());
                        coreDto.setPricePerKg(usage.getPricePerKg());
                        coreDto.setCost(usage.getCost());
                        dto.setRoundCore(coreDto);
                    });
        }

        // Windings
        List<TransformerDetailDto.WindingUsageDto> windingDtos = transformerWindingRepository.findByTransformer(t)
                .stream()
                .map(w -> {
                    TransformerDetailDto.WindingUsageDto wd = new TransformerDetailDto.WindingUsageDto();
                    wd.setSpecName(w.getWindingSpec().getName());
                    wd.setMaterial(w.getWindingSpec().getMaterial().name());
                    wd.setType(w.getWindingSpec().getType().name());
                    wd.setDiameter(w.getWindingSpec().getDiameter());
                    wd.setPricePerKg(w.getWindingSpec().getPricePerKg());
                    wd.setWeightKg(w.getWeightKg());
                    wd.setCost(w.getCost());
                    return wd;
                }).collect(Collectors.toList());
        dto.setWindings(windingDtos);

        // Accessories
        List<TransformerDetailDto.AccessoryUsageDto> accDtos = transformerAccessoryUsageRepository.findByTransformer(t)
                .stream()
                .map(a -> {
                    TransformerDetailDto.AccessoryUsageDto ad = new TransformerDetailDto.AccessoryUsageDto();
                    ad.setAccessoryName(a.getAccessory().getName());
                    ad.setType(a.getAccessory().getType().name());
                    ad.setUnitType(a.getAccessory().getUnitType().name());
                    ad.setUnitPrice(a.getAccessory().getUnitPrice());
                    ad.setQuantity(a.getQuantity());
                    ad.setCost(a.getCost());
                    return ad;
                }).collect(Collectors.toList());
        dto.setAccessories(accDtos);

        return dto;
    }
}
