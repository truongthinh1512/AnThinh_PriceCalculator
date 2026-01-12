package com.anthinh.pricecalculator.service;

import com.anthinh.pricecalculator.dto.AccessoryDto;
import com.anthinh.pricecalculator.dto.EiLaminationDto;
import com.anthinh.pricecalculator.dto.WindingSpecDto;
import com.anthinh.pricecalculator.model.*;
import com.anthinh.pricecalculator.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final WindingSpecRepository windingSpecRepository;
    private final AccessoryRepository accessoryRepository;
    private final EiLaminationRepository eiLaminationRepository;
    private final EiCoreRepository eiCoreRepository;

    // --- WindingSpec ---
    public List<WindingSpecDto> getAllWindingSpecs() {
        return windingSpecRepository.findAll().stream().map(this::mapToWindingDto).collect(Collectors.toList());
    }

    public WindingSpecDto createWindingSpec(WindingSpecDto dto) {
        WindingSpec entity = new WindingSpec();
        updateWindingEntity(entity, dto);
        return mapToWindingDto(windingSpecRepository.save(entity));
    }

    public WindingSpecDto updateWindingSpec(Long id, WindingSpecDto dto) {
        WindingSpec entity = windingSpecRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WindingSpec not found"));
        updateWindingEntity(entity, dto);
        return mapToWindingDto(windingSpecRepository.save(entity));
    }

    public void deleteWindingSpec(Long id) {
        windingSpecRepository.deleteById(id);
    }

    // --- Accessory ---
    public List<AccessoryDto> getAllAccessories() {
        return accessoryRepository.findAll().stream().map(this::mapToAccessoryDto).collect(Collectors.toList());
    }

    public AccessoryDto createAccessory(AccessoryDto dto) {
        Accessory entity = new Accessory();
        updateAccessoryEntity(entity, dto);
        return mapToAccessoryDto(accessoryRepository.save(entity));
    }

    public AccessoryDto updateAccessory(Long id, AccessoryDto dto) {
        Accessory entity = accessoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Accessory not found"));
        updateAccessoryEntity(entity, dto);
        return mapToAccessoryDto(accessoryRepository.save(entity));
    }

    public void deleteAccessory(Long id) {
        accessoryRepository.deleteById(id);
    }

    // --- EiLamination & EiCore ---
    public List<EiLaminationDto> getAllEiLaminations() {
        List<EiLamination> laminations = eiLaminationRepository.findAll();
        List<EiCore> cores = eiCoreRepository.findAll();
        // Optimize: Map cores by lamination ID to avoid N+1 queries
        java.util.Map<Long, EiCore> coreMap = cores.stream()
                .collect(Collectors.toMap(c -> c.getLamination().getId(), c -> c, (existing, replacement) -> existing));

        return laminations.stream().map(lam -> {
            EiCore core = coreMap.get(lam.getId());
            return mapToEiLaminationDto(lam, core);
        }).collect(Collectors.toList());
    }

    @Transactional
    public EiLaminationDto createEiLamination(EiLaminationDto dto) {
        EiLamination lamination = new EiLamination();
        lamination.setName(dto.getName());
        lamination.setDescription(dto.getDescription());
        lamination.setPricePerKg(dto.getPricePerKg());
        lamination = eiLaminationRepository.save(lamination);

        EiCore core = new EiCore();
        core.setLamination(lamination);
        core.setName(dto.getCoreName() != null ? dto.getCoreName() : dto.getName());
        core.setDescription(dto.getCoreDescription());
        core.setPrice(dto.getCorePrice());
        core = eiCoreRepository.save(core);

        return mapToEiLaminationDto(lamination, core);
    }

    @Transactional
    public EiLaminationDto updateEiLamination(Long id, EiLaminationDto dto) {
        EiLamination lamination = eiLaminationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("EiLamination not found"));
        
        lamination.setName(dto.getName());
        lamination.setDescription(dto.getDescription());
        lamination.setPricePerKg(dto.getPricePerKg());
        lamination = eiLaminationRepository.save(lamination);

        EiCore core = eiCoreRepository.findByLamination(lamination)
                .orElse(new EiCore()); // Should ideally exist, but fallback to new if missing
        
        if (core.getId() == null) {
            core.setLamination(lamination);
        }
        
        core.setName(dto.getCoreName() != null ? dto.getCoreName() : dto.getName());
        core.setDescription(dto.getCoreDescription());
        core.setPrice(dto.getCorePrice());
        eiCoreRepository.save(core);

        return mapToEiLaminationDto(lamination, core);
    }

    @Transactional
    public void deleteEiLamination(Long id) {
        EiLamination lamination = eiLaminationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("EiLamination not found"));
        // EiCore is OneToOne but we might need to delete it manually if CascadeType is not set to REMOVE
        // Checking EiCore entity definition: CascadeType is NOT defined in OneToOne annotation in EiCore class provided earlier.
        // Wait, EiCore OWNS the relationship (@JoinColumn is in EiCore). EiLamination doesn't know about EiCore.
        // So we must delete EiCore FIRST.
        
        eiCoreRepository.findByLamination(lamination).ifPresent(eiCoreRepository::delete);
        eiLaminationRepository.delete(lamination);
    }

    // --- Mappers ---
    private WindingSpecDto mapToWindingDto(WindingSpec entity) {
        WindingSpecDto dto = new WindingSpecDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setType(entity.getType());
        dto.setMaterial(entity.getMaterial());
        dto.setDiameter(entity.getDiameter());
        dto.setPricePerKg(entity.getPricePerKg());
        return dto;
    }

    private void updateWindingEntity(WindingSpec entity, WindingSpecDto dto) {
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setType(dto.getType());
        entity.setMaterial(dto.getMaterial());
        entity.setDiameter(dto.getDiameter());
        entity.setPricePerKg(dto.getPricePerKg());
    }

    private AccessoryDto mapToAccessoryDto(Accessory entity) {
        AccessoryDto dto = new AccessoryDto();
        dto.setId(entity.getId());
        dto.setType(entity.getType());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setUnitType(entity.getUnitType());
        dto.setUnitPrice(entity.getUnitPrice());
        return dto;
    }

    private void updateAccessoryEntity(Accessory entity, AccessoryDto dto) {
        entity.setType(dto.getType());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setUnitType(dto.getUnitType());
        entity.setUnitPrice(dto.getUnitPrice());
    }

    private EiLaminationDto mapToEiLaminationDto(EiLamination lamination, EiCore core) {
        EiLaminationDto dto = new EiLaminationDto();
        dto.setId(lamination.getId());
        dto.setName(lamination.getName());
        dto.setDescription(lamination.getDescription());
        dto.setPricePerKg(lamination.getPricePerKg());
        if (core != null) {
            dto.setCoreId(core.getId());
            dto.setCoreName(core.getName());
            dto.setCoreDescription(core.getDescription());
            dto.setCorePrice(core.getPrice());
        }
        return dto;
    }
}
