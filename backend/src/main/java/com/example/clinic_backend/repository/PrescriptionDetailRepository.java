package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.PrescriptionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionDetailRepository extends JpaRepository<PrescriptionDetail, Long> {
    
    List<PrescriptionDetail> findByMedicalRecordId(Long medicalRecordId);
    
    @Query("SELECT pd FROM PrescriptionDetail pd WHERE pd.medicalRecordId = :medicalRecordId")
    List<PrescriptionDetail> findPrescriptionByMedicalRecordId(@Param("medicalRecordId") Long medicalRecordId);
    
    @Query("SELECT SUM(pd.totalPrice) FROM PrescriptionDetail pd WHERE pd.medicalRecordId = :medicalRecordId")
    Double getTotalPrescriptionPrice(@Param("medicalRecordId") Long medicalRecordId);
    
    boolean existsByMedicalRecordId(Long medicalRecordId);
}