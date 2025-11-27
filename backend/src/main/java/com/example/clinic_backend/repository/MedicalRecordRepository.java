package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    
    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);
    
    List<MedicalRecord> findByDoctorIdOrderByExaminationDateDesc(Long doctorId);
    
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.appointmentId = :appointmentId AND mr.examinationStatus = 'COMPLETED'")
    Optional<MedicalRecord> findCompletedByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    boolean existsByAppointmentId(Long appointmentId);
    
    @Query("SELECT mr FROM MedicalRecord mr JOIN PatientRegistration pr ON mr.appointmentId = pr.id WHERE pr.patientCode = :patientCode ORDER BY mr.examinationDate DESC")
    List<MedicalRecord> findByPatientCodeOrderByExaminationDateDesc(@Param("patientCode") String patientCode);
}