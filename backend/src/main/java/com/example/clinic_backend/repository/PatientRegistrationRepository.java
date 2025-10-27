package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PatientRegistrationRepository extends JpaRepository<PatientRegistration, Long> {
    
    // ==================== METHOD MỚI CHO ADMIN ====================
    
    // Method mới: Lấy tất cả registration với doctor info - DÙNG CHO ADMIN
    @EntityGraph(attributePaths = {"doctor"})
    @Query("SELECT pr FROM PatientRegistration pr ORDER BY pr.createdAt DESC")
    List<PatientRegistration> findAllWithDoctor();
    
    // Method cũ: Lấy tất cả registration (không fetch doctor) - DÙNG CHO STATS
    List<PatientRegistration> findAll();
    
    
    // ==================== METHOD HIỆN CÓ - GIỮ NGUYÊN ====================
    
    List<PatientRegistration> findByEmail(String email);
    
    @Query("SELECT p FROM PatientRegistration p LEFT JOIN FETCH p.doctor WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailWithDoctor(@Param("email") String email);
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailCustom(@Param("email") String email);
    
    List<PatientRegistration> findByPhone(String phone);
    List<PatientRegistration> findByStatus(String status);

    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE DATE(r.createdAt) = CURRENT_DATE")
    Long countByCreatedAtToday();
    
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE YEAR(r.createdAt) = :year")
    Long countByYear(@Param("year") int year);
    
    // SỬA: Đổi parameter type từ String sang LocalDate
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE r.appointmentDate = :appointmentDate AND r.assignedSession = :assignedSession AND r.status = 'APPROVED'")
    int countApprovedByDateAndSession(@Param("appointmentDate") LocalDate appointmentDate, 
                                     @Param("assignedSession") String assignedSession);
    
    List<PatientRegistration> findByEmailOrderByCreatedAtDesc(String email);
    List<PatientRegistration> findByStatusOrderByCreatedAtAsc(String status);
    
    // ==================== METHOD MỚI CHO SLOT MANAGEMENT ====================
    
    // Method mới: Đếm số đăng ký APPROVED theo bác sĩ, ngày và khung giờ
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = :status")
    Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession,
        @Param("status") String status
    );
}