package com.anthinh.pricecalculator.repository;

import com.anthinh.pricecalculator.model.SquareCoreUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import com.anthinh.pricecalculator.model.Transformer;
import java.util.Optional;

public interface SquareCoreUsageRepository extends JpaRepository<SquareCoreUsage, Long> {
    Optional<SquareCoreUsage> findByTransformer(Transformer transformer);
}
