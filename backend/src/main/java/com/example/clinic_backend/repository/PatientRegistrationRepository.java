package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientRegistrationRepository extends JpaRepository<PatientRegistration, Long> {
    
    // Method name query thường
    List<PatientRegistration> findByEmail(String email);
    
    // Custom query với JOIN FETCH để lấy thông tin bác sĩ
    @Query("SELECT p FROM PatientRegistration p LEFT JOIN FETCH p.doctor WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailWithDoctor(@Param("email") String email);
    
    // Custom query fallback
    @Query("SELECT p FROM PatientRegistration p WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailCustom(@Param("email") String email);
    
    // Các method khác
    List<PatientRegistration> findByPhone(String phone);
    List<PatientRegistration> findByStatus(String status);
}