package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    
    List<MedicalRecord> findByAppointmentId(Long appointmentId);
    
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.appointmentId = :appointmentId ORDER BY mr.createdAt DESC")
    List<MedicalRecord> findByAppointmentIdOrderByCreatedAtDesc(@Param("appointmentId") Long appointmentId);
    
    default Optional<MedicalRecord> findFirstByAppointmentIdOrderByCreatedAtDesc(Long appointmentId) {
        List<MedicalRecord> records = findByAppointmentIdOrderByCreatedAtDesc(appointmentId);
        return records.isEmpty() ? Optional.empty() : Optional.of(records.get(0));
    }
    
    List<MedicalRecord> findByDoctorIdOrderByExaminationDateDesc(Long doctorId);
    
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.appointmentId = :appointmentId AND mr.examinationStatus = 'COMPLETED'")
    Optional<MedicalRecord> findCompletedByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    boolean existsByAppointmentId(Long appointmentId);
    
    @Query("SELECT mr FROM MedicalRecord mr JOIN PatientRegistration pr ON mr.appointmentId = pr.id WHERE pr.patientCode = :patientCode ORDER BY mr.examinationDate DESC")
    List<MedicalRecord> findByPatientCodeOrderByExaminationDateDesc(@Param("patientCode") String patientCode);

    @Query("SELECT DISTINCT mr FROM MedicalRecord mr " +
           "LEFT JOIN PatientRegistration pr ON mr.appointmentId = pr.id " +
           "WHERE mr.doctorId = :doctorId " +
           "ORDER BY mr.examinationDate DESC NULLS LAST, mr.updatedAt DESC NULLS LAST, mr.createdAt DESC NULLS LAST")
    Page<MedicalRecord> findByDoctorId(@Param("doctorId") Long doctorId, Pageable pageable);

    @Query("SELECT mr FROM MedicalRecord mr " +
           "WHERE mr.doctorId = :doctorId " +
           "ORDER BY mr.examinationDate DESC, mr.updatedAt DESC, mr.createdAt DESC")
    List<MedicalRecord> findAllByDoctorIdOrderByDateDesc(@Param("doctorId") Long doctorId);
}