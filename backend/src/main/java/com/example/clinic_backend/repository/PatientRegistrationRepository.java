package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRegistrationRepository extends JpaRepository<PatientRegistration, Long> {
    
    // ==================== METHOD MỚI CHO EMAIL REMINDER ====================
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status")
    List<PatientRegistration> findByAppointmentDateAndStatus(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // 🔥 METHOD MỚI: CHỈ LẤY CÁC LỊCH CHƯA ĐƯỢC GỬI REMINDER
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status AND (p.reminderSent = false OR p.reminderSent IS NULL)")
    List<PatientRegistration> findByAppointmentDateAndStatusAndReminderNotSent(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // ==================== METHOD HIỆN CÓ - GIỮ NGUYÊN ====================
    
    @EntityGraph(attributePaths = {"doctor"})
    @Query("SELECT pr FROM PatientRegistration pr ORDER BY pr.createdAt DESC")
    List<PatientRegistration> findAllWithDoctor();
    
    List<PatientRegistration> findAll();
    
    // 🔥 THÊM METHOD MỚI: Lấy theo email với JOIN FETCH doctor
    @Query("SELECT p FROM PatientRegistration p LEFT JOIN FETCH p.doctor WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailWithDoctor(@Param("email") String email);
    
    // Giữ method cũ để backup
    List<PatientRegistration> findByEmail(String email);
    
    List<PatientRegistration> findByPhone(String phone);
    List<PatientRegistration> findByStatus(String status);

    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE DATE(r.createdAt) = CURRENT_DATE")
    Long countByCreatedAtToday();
    
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE YEAR(r.createdAt) = :year")
    Long countByYear(@Param("year") int year);
    
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE r.appointmentDate = :appointmentDate AND r.assignedSession = :assignedSession AND r.status = 'APPROVED'")
    int countApprovedByDateAndSession(@Param("appointmentDate") LocalDate appointmentDate, 
                                     @Param("assignedSession") String assignedSession);
    
    List<PatientRegistration> findByEmailOrderByCreatedAtDesc(String email);
    List<PatientRegistration> findByStatusOrderByCreatedAtAsc(String status);
    
    // ==================== METHOD CHO SLOT MANAGEMENT ====================
    
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = :status")
    Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession,
        @Param("status") String status
    );
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = 'APPROVED'")
    Integer countApprovedRegistrationsWithLock(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = 'APPROVED'")
    List<PatientRegistration> findByDoctorAndDateAndSession(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
}