package com.anthinh.pricecalculator.repository;

import com.anthinh.pricecalculator.model.RoundCoreUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import com.anthinh.pricecalculator.model.Transformer;
import java.util.Optional;

public interface RoundCoreUsageRepository extends JpaRepository<RoundCoreUsage, Long> {
    Optional<RoundCoreUsage> findByTransformer(Transformer transformer);
}
