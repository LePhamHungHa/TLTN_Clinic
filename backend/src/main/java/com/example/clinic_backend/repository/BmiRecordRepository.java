package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.BmiRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BmiRecordRepository extends JpaRepository<BmiRecord, Long> {
    
    List<BmiRecord> findByPatientIdOrderByMeasurementDateDesc(Long patientId);
    
    List<BmiRecord> findByPatientIdAndMeasurementDateBetween(Long patientId, LocalDate startDate, LocalDate endDate);
    
    List<BmiRecord> findByPatientId(Long patientId);
    
    Optional<BmiRecord> findFirstByPatientIdOrderByMeasurementDateDesc(Long patientId);
}