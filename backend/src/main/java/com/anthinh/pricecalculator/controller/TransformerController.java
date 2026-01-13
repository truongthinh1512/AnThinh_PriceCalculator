package com.anthinh.pricecalculator.controller;

import com.anthinh.pricecalculator.dto.RoundTransformerRequest;
import com.anthinh.pricecalculator.dto.SquareTransformerRequest;
import com.anthinh.pricecalculator.dto.TransformerDetailDto;
import com.anthinh.pricecalculator.service.TransformerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transformers")
@RequiredArgsConstructor
public class TransformerController {

    private final TransformerService transformerService;

    @GetMapping
    public ResponseEntity<List<TransformerDetailDto>> getAllTransformers() {
        return ResponseEntity.ok(transformerService.getAllTransformers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransformerDetailDto> getTransformerDetails(@PathVariable Long id) {
        return ResponseEntity.ok(transformerService.getTransformerDetails(id));
    }

    @PostMapping("/square")
    public ResponseEntity<TransformerDetailDto> createSquareTransformer(@RequestBody SquareTransformerRequest request) {
        return ResponseEntity.ok(transformerService.createSquareTransformer(request));
    }

    @PutMapping("/square/{id}")
    public ResponseEntity<TransformerDetailDto> updateSquareTransformer(@PathVariable Long id, @RequestBody SquareTransformerRequest request) {
        return ResponseEntity.ok(transformerService.updateSquareTransformer(id, request));
    }

    @PostMapping("/round")
    public ResponseEntity<TransformerDetailDto> createRoundTransformer(@RequestBody RoundTransformerRequest request) {
        return ResponseEntity.ok(transformerService.createRoundTransformer(request));
    }

    @PutMapping("/round/{id}")
    public ResponseEntity<TransformerDetailDto> updateRoundTransformer(@PathVariable Long id, @RequestBody RoundTransformerRequest request) {
        return ResponseEntity.ok(transformerService.updateRoundTransformer(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable Long id) {
        transformerService.deleteTransformer(id);
        return ResponseEntity.noContent().build();
    }
}
