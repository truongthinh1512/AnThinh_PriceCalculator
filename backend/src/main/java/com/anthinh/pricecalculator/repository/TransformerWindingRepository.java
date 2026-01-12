package com.anthinh.pricecalculator.repository;

import com.anthinh.pricecalculator.model.TransformerWinding;
import org.springframework.data.jpa.repository.JpaRepository;

import com.anthinh.pricecalculator.model.Transformer;
import java.util.List;

public interface TransformerWindingRepository extends JpaRepository<TransformerWinding, Long> {
    List<TransformerWinding> findByTransformer(Transformer transformer);
}