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
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status AND (p.reminderSent = false OR p.reminderSent IS NULL)")
    List<PatientRegistration> findByAppointmentDateAndStatusAndReminderNotSent(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // ==================== METHOD HIỆN CÓ - GIỮ NGUYÊN ====================
    
    @EntityGraph(attributePaths = {"doctor"})
    @Query("SELECT pr FROM PatientRegistration pr ORDER BY pr.createdAt DESC")
    List<PatientRegistration> findAllWithDoctor();
    
    List<PatientRegistration> findAll();
    
    @Query("SELECT p FROM PatientRegistration p LEFT JOIN FETCH p.doctor WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailWithDoctor(@Param("email") String email);
    
    // Giữ method cũ để backup
    List<PatientRegistration> findByEmail(String email);
    
    List<PatientRegistration> findByPhone(String phone);
    List<PatientRegistration> findByStatus(String status);
    
    List<PatientRegistration> findByPaymentStatus(String paymentStatus);

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
    
    // ==================== METHOD QUAN TRỌNG CHO STATISTICS ====================
    
    // 1. Lấy appointments theo doctor và ngày (có hoặc không có session)
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate = :appointmentDate " +
           "AND (:assignedSession IS NULL OR p.assignedSession = :assignedSession)")
    List<PatientRegistration> findByDoctorAndDateAndSession(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
    
    // 2. Lấy appointments theo doctor và khoảng thời gian (KHÔNG filter status)
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate BETWEEN :startDate AND :endDate " +
           "ORDER BY p.appointmentDate ASC, p.assignedSession ASC")
    List<PatientRegistration> findByDoctorIdAndDateRange(
        @Param("doctorId") Long doctorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // 3. Lấy appointments theo doctor, khoảng thời gian và status
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate BETWEEN :startDate AND :endDate " +
           "AND p.status = :status " +
           "ORDER BY p.appointmentDate ASC, p.assignedSession ASC")
    List<PatientRegistration> findByDoctorIdAndDateRangeAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("status") String status
    );
    
    // 4. Lấy appointments theo doctor, khoảng thời gian và nhiều status (dùng IN)
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate BETWEEN :startDate AND :endDate " +
           "AND p.status IN :statusList " +
           "ORDER BY p.appointmentDate ASC, p.assignedSession ASC")
    List<PatientRegistration> findByDoctorIdAndDateRangeAndStatusIn(
        @Param("doctorId") Long doctorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("statusList") List<String> statusList
    );
    
    // 5. Lấy appointments theo doctor và ngày với trạng thái cụ thể
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate = :appointmentDate " +
           "AND p.status = :status")
    List<PatientRegistration> findByDoctorIdAndAppointmentDateAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("status") String status
    );
    
    // ==================== THÊM PHƯƠNG THỨC MỚI CHO PATIENT MEDICAL RECORDS ====================
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.userId = :userId ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.patientCode = :patientCode ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByPatientCode(@Param("patientCode") String patientCode);
    
    @Query("SELECT p FROM PatientRegistration p WHERE p.email = :email ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByEmailOrderByAppointmentDateDesc(@Param("email") String email);
}