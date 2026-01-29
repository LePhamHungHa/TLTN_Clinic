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
    
    // Tìm lịch hẹn theo ngày và trạng thái
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status")
    List<PatientRegistration> findByAppointmentDateAndStatus(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // Tìm lịch hẹn chưa được gửi reminder
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status AND (p.reminderSent = false OR p.reminderSent IS NULL)")
    List<PatientRegistration> findByAppointmentDateAndStatusAndReminderNotSent(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // Lấy tất cả lịch hẹn với thông tin bác sĩ
    @EntityGraph(attributePaths = {"doctor"})
    @Query("SELECT pr FROM PatientRegistration pr ORDER BY pr.createdAt DESC")
    List<PatientRegistration> findAllWithDoctor();
    
    // Lấy lịch hẹn theo email với thông tin bác sĩ
    @Query("SELECT p FROM PatientRegistration p LEFT JOIN FETCH p.doctor WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailWithDoctor(@Param("email") String email);
    
    // Các phương thức tìm kiếm cơ bản
    List<PatientRegistration> findByEmail(String email);
    List<PatientRegistration> findByPhone(String phone);
    List<PatientRegistration> findByStatus(String status);
    List<PatientRegistration> findByPaymentStatus(String paymentStatus);
    List<PatientRegistration> findByRefundStatus(String refundStatus);

    // Thống kê
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE DATE(r.createdAt) = CURRENT_DATE")
    Long countByCreatedAtToday();
    
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE YEAR(r.createdAt) = :year")
    Long countByYear(@Param("year") int year);
    
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE r.appointmentDate = :appointmentDate AND r.assignedSession = :assignedSession AND r.status = 'APPROVED'")
    int countApprovedByDateAndSession(@Param("appointmentDate") LocalDate appointmentDate, 
                                     @Param("assignedSession") String assignedSession);
    
    // Sắp xếp
    List<PatientRegistration> findByEmailOrderByCreatedAtDesc(String email);
    List<PatientRegistration> findByStatusOrderByCreatedAtAsc(String status);
    
    // Quản lý slot
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = :status")
    Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession,
        @Param("status") String status
    );
    
    // Khóa khi đếm để tránh race condition
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = 'APPROVED'")
    Integer countApprovedRegistrationsWithLock(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
    
    // Tìm theo bác sĩ và ngày
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate = :appointmentDate " +
           "AND (:assignedSession IS NULL OR p.assignedSession = :assignedSession)")
    List<PatientRegistration> findByDoctorAndDateAndSession(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
    
    // Tìm theo bác sĩ và khoảng thời gian
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate BETWEEN :startDate AND :endDate " +
           "ORDER BY p.appointmentDate ASC, p.assignedSession ASC")
    List<PatientRegistration> findByDoctorIdAndDateRange(
        @Param("doctorId") Long doctorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Tìm theo userId
    @Query("SELECT p FROM PatientRegistration p WHERE p.userId = :userId ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByUserId(@Param("userId") Long userId);
    
    // Tìm theo patientCode
    @Query("SELECT p FROM PatientRegistration p WHERE p.patientCode = :patientCode ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByPatientCode(@Param("patientCode") String patientCode);
    
    // Tìm theo email và sắp xếp theo ngày hẹn
    @Query("SELECT p FROM PatientRegistration p WHERE p.email = :email ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByEmailOrderByAppointmentDateDesc(@Param("email") String email);
    
    // Tìm lịch hẹn có thể hủy
    @Query("SELECT p FROM PatientRegistration p WHERE p.status != 'CANCELLED' " +
           "AND p.appointmentDate > :tomorrow " +
           "AND p.userId = :userId")
    List<PatientRegistration> findCancellableAppointments(
        @Param("userId") Long userId,
        @Param("tomorrow") LocalDate tomorrow
    );
    
    // Đếm số lịch đã hủy
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.userId = :userId AND p.status = 'CANCELLED'")
    Long countCancelledByUserId(@Param("userId") Long userId);
    
    // Tìm theo userId và status
    @Query("SELECT p FROM PatientRegistration p WHERE p.userId = :userId AND p.status = :status ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") String status
    );
    
    // Tìm yêu cầu hoàn tiền
    @Query("SELECT p FROM PatientRegistration p WHERE p.refundStatus = 'REQUESTED' ORDER BY p.refundRequestedAt ASC")
    List<PatientRegistration> findRefundRequests();
}