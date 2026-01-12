package com.anthinh.pricecalculator.repository;

import com.anthinh.pricecalculator.model.EiCore;
import com.anthinh.pricecalculator.model.EiLamination;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EiCoreRepository extends JpaRepository<EiCore, Long> {
    Optional<EiCore> findByLamination(EiLamination lamination);
}
