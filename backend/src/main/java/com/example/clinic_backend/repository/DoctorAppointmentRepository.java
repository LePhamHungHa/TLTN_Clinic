package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDate;

@Repository
public interface DoctorAppointmentRepository extends JpaRepository<PatientRegistration, Long> {
    
    // Lấy tất cả lịch hẹn của bác sĩ
    List<PatientRegistration> findByDoctorIdOrderByAppointmentDateDescCreatedAtDesc(Long doctorId);
    
    // Lấy lịch hẹn theo trạng thái
    List<PatientRegistration> findByDoctorIdAndStatusOrderByAppointmentDateDesc(Long doctorId, String status);
    
    // Lấy lịch hẹn hôm nay
    List<PatientRegistration> findByDoctorIdAndAppointmentDateOrderByQueueNumberAsc(Long doctorId, LocalDate appointmentDate);
    
    // Lấy lịch hẹn theo khoảng thời gian
    @Query("SELECT p FROM PatientRegistration p WHERE p.doctorId = :doctorId AND p.appointmentDate BETWEEN :startDate AND :endDate ORDER BY p.appointmentDate DESC, p.queueNumber ASC")
    List<PatientRegistration> findByDoctorIdAndAppointmentDateBetween(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    // Đếm số lịch hẹn theo trạng thái
    Long countByDoctorIdAndStatus(Long doctorId, String status);
}