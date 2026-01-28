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
    
    // tim theo ngay hen va trang thai
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status")
    List<PatientRegistration> findByAppointmentDateAndStatus(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // tim theo ngay hen va trang thai chua gui nhac
    @Query("SELECT p FROM PatientRegistration p WHERE p.appointmentDate = :date AND p.status = :status AND (p.reminderSent = false OR p.reminderSent IS NULL)")
    List<PatientRegistration> findByAppointmentDateAndStatusAndReminderNotSent(
            @Param("date") LocalDate date, 
            @Param("status") String status);
    
    // lay tat ca voi thong tin bac si
    @EntityGraph(attributePaths = {"doctor"})
    @Query("SELECT pr FROM PatientRegistration pr ORDER BY pr.createdAt DESC")
    List<PatientRegistration> findAllWithDoctor();
    
    List<PatientRegistration> findAll();
    
    // tim theo email voi thong tin bac si
    @Query("SELECT p FROM PatientRegistration p LEFT JOIN FETCH p.doctor WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PatientRegistration> findByEmailWithDoctor(@Param("email") String email);
    
    // method cu backup
    List<PatientRegistration> findByEmail(String email);
    
    List<PatientRegistration> findByPhone(String phone);
    List<PatientRegistration> findByStatus(String status);
    
    List<PatientRegistration> findByPaymentStatus(String paymentStatus);

    // dem so luong don tao hom nay
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE DATE(r.createdAt) = CURRENT_DATE")
    Long countByCreatedAtToday();
    
    // dem theo nam
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE YEAR(r.createdAt) = :year")
    Long countByYear(@Param("year") int year);
    
    // dem da duyet theo ngay va khung gio
    @Query("SELECT COUNT(r) FROM PatientRegistration r WHERE r.appointmentDate = :appointmentDate AND r.assignedSession = :assignedSession AND r.status = 'APPROVED'")
    int countApprovedByDateAndSession(@Param("appointmentDate") LocalDate appointmentDate, 
                                     @Param("assignedSession") String assignedSession);
    
    List<PatientRegistration> findByEmailOrderByCreatedAtDesc(String email);
    List<PatientRegistration> findByStatusOrderByCreatedAtAsc(String status);
    
    // dem theo bac si, ngay hen, khung gio va trang thai
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = :status")
    Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession,
        @Param("status") String status
    );
    
    // dem voi lock de tranh xung dot
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COUNT(p) FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate = :appointmentDate AND p.assignedSession = :assignedSession AND p.status = 'APPROVED'")
    Integer countApprovedRegistrationsWithLock(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
    
    
    // 1. lay appointments theo bac si va ngay (co hoac khong co session)
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate = :appointmentDate " +
           "AND (:assignedSession IS NULL OR p.assignedSession = :assignedSession)")
    List<PatientRegistration> findByDoctorAndDateAndSession(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("assignedSession") String assignedSession
    );
    
    // 2. lay appointments theo bac si va khoang thoi gian
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate BETWEEN :startDate AND :endDate " +
           "ORDER BY p.appointmentDate ASC, p.assignedSession ASC")
    List<PatientRegistration> findByDoctorIdAndDateRange(
        @Param("doctorId") Long doctorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // 3. lay appointments theo bac si, khoang thoi gian va status
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
    
    // 4. lay appointments theo bac si, khoang thoi gian va nhieu status
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
    
    // 5. lay appointments theo bac si va ngay voi trang thai cu the
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId " +
           "AND p.appointmentDate = :appointmentDate " +
           "AND p.status = :status")
    List<PatientRegistration> findByDoctorIdAndAppointmentDateAndStatus(
        @Param("doctorId") Long doctorId,
        @Param("appointmentDate") LocalDate appointmentDate,
        @Param("status") String status
    );
    
    
    // tim theo user id
    @Query("SELECT p FROM PatientRegistration p WHERE p.userId = :userId ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByUserId(@Param("userId") Long userId);
    
    // tim theo ma benh nhan
    @Query("SELECT p FROM PatientRegistration p WHERE p.patientCode = :patientCode ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByPatientCode(@Param("patientCode") String patientCode);
    
    // tim theo email sap xep theo ngay hen
    @Query("SELECT p FROM PatientRegistration p WHERE p.email = :email ORDER BY p.appointmentDate DESC")
    List<PatientRegistration> findByEmailOrderByAppointmentDateDesc(@Param("email") String email);
}