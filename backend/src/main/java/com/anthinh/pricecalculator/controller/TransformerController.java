package com.anthinh.pricecalculator.controller;

import com.anthinh.pricecalculator.dto.RoundTransformerRequest;
import com.anthinh.pricecalculator.dto.SquareTransformerRequest;
import com.anthinh.pricecalculator.dto.TransformerDetailDto;
import com.anthinh.pricecalculator.service.TransformerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transformers")
@RequiredArgsConstructor
public class TransformerController {

    private final TransformerService transformerService;

    @PostMapping("/square")
    public ResponseEntity<TransformerDetailDto> createSquareTransformer(@RequestBody SquareTransformerRequest request) {
        return ResponseEntity.ok(transformerService.createSquareTransformer(request));
    }

    @PostMapping("/round")
    public ResponseEntity<TransformerDetailDto> createRoundTransformer(@RequestBody RoundTransformerRequest request) {
        return ResponseEntity.ok(transformerService.createRoundTransformer(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransformerDetailDto> getTransformerDetails(@PathVariable Long id) {
        return ResponseEntity.ok(transformerService.getTransformerDetails(id));
    }
}
