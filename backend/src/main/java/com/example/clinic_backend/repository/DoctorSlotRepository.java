package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.DoctorSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorSlotRepository extends JpaRepository<DoctorSlot, Long> {
    
    List<DoctorSlot> findByDoctorIdAndAppointmentDate(Long doctorId, String appointmentDate);
    
    DoctorSlot findByDoctorIdAndAppointmentDateAndTimeSlot(Long doctorId, String appointmentDate, String timeSlot);
    
    @Query("SELECT ds FROM DoctorSlot ds WHERE ds.doctorId = :doctorId AND ds.appointmentDate = :appointmentDate AND ds.timeSlot = :timeSlot")
    Optional<DoctorSlot> findAvailableSlot(@Param("doctorId") Long doctorId, 
                                         @Param("appointmentDate") String appointmentDate, 
                                         @Param("timeSlot") String timeSlot);
    
    boolean existsByDoctorIdAndAppointmentDateAndTimeSlot(Long doctorId, String appointmentDate, String timeSlot);
}