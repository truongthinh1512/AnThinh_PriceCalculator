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

    @PutMapping("/winding-specs/{id}")
    public ResponseEntity<WindingSpecDto> updateWindingSpec(@PathVariable Long id, @RequestBody WindingSpecDto dto) {
        return ResponseEntity.ok(catalogService.updateWindingSpec(id, dto));
    }

    @DeleteMapping("/winding-specs/{id}")
    public ResponseEntity<Void> deleteWindingSpec(@PathVariable Long id) {
        catalogService.deleteWindingSpec(id);
        return ResponseEntity.noContent().build();
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

    @PutMapping("/accessories/{id}")
    public ResponseEntity<AccessoryDto> updateAccessory(@PathVariable Long id, @RequestBody AccessoryDto dto) {
        return ResponseEntity.ok(catalogService.updateAccessory(id, dto));
    }

    @DeleteMapping("/accessories/{id}")
    public ResponseEntity<Void> deleteAccessory(@PathVariable Long id) {
        catalogService.deleteAccessory(id);
        return ResponseEntity.noContent().build();
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

    @PutMapping("/ei-laminations/{id}")
    public ResponseEntity<EiLaminationDto> updateEiLamination(@PathVariable Long id, @RequestBody EiLaminationDto dto) {
        return ResponseEntity.ok(catalogService.updateEiLamination(id, dto));
    }

    @DeleteMapping("/ei-laminations/{id}")
    public ResponseEntity<Void> deleteEiLamination(@PathVariable Long id) {
        catalogService.deleteEiLamination(id);
        return ResponseEntity.noContent().build();
    }
}
