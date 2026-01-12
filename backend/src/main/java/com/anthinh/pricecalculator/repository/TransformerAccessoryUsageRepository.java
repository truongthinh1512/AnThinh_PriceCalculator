package com.anthinh.pricecalculator.repository;

import com.anthinh.pricecalculator.model.TransformerAccessoryUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import com.anthinh.pricecalculator.model.Transformer;
import java.util.List;

public interface TransformerAccessoryUsageRepository extends JpaRepository<TransformerAccessoryUsage, Long> {
    List<TransformerAccessoryUsage> findByTransformer(Transformer transformer);
}