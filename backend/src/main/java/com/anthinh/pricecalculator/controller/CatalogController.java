package com.anthinh.pricecalculator.controller;

import com.anthinh.pricecalculator.dto.AccessoryDto;
import com.anthinh.pricecalculator.dto.EiLaminationDto;
import com.anthinh.pricecalculator.dto.WindingSpecDto;
import com.anthinh.pricecalculator.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    // --- Winding Spec ---
    @GetMapping("/winding-specs")
    public ResponseEntity<List<WindingSpecDto>> getWindingSpecs() {
        return ResponseEntity.ok(catalogService.getAllWindingSpecs());
    }

    @PostMapping("/winding-specs")
    public ResponseEntity<WindingSpecDto> createWindingSpec(@RequestBody WindingSpecDto dto) {
        return ResponseEntity.ok(catalogService.createWindingSpec(dto));
    }

    // --- Accessory ---
    @GetMapping("/accessories")
    public ResponseEntity<List<AccessoryDto>> getAccessories() {
        return ResponseEntity.ok(catalogService.getAllAccessories());
    }

    @PostMapping("/accessories")
    public ResponseEntity<AccessoryDto> createAccessory(@RequestBody AccessoryDto dto) {
        return ResponseEntity.ok(catalogService.createAccessory(dto));
    }

    // --- Ei Lamination ---
    @GetMapping("/ei-laminations")
    public ResponseEntity<List<EiLaminationDto>> getEiLaminations() {
        return ResponseEntity.ok(catalogService.getAllEiLaminations());
    }

    @PostMapping("/ei-laminations")
    public ResponseEntity<EiLaminationDto> createEiLamination(@RequestBody EiLaminationDto dto) {
        return ResponseEntity.ok(catalogService.createEiLamination(dto));
    }
}
