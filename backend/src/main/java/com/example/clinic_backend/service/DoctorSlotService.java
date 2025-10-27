package com.example.clinic_backend.service;

import com.example.clinic_backend.dto.DoctorSlotDTO;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DoctorSlotService {
    
    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;
    
    public List<DoctorSlotDTO> getSlotsByDoctorAndDate(Long doctorId, String appointmentDate) {
        List<DoctorSlotDTO> slots = new ArrayList<>();
        String[] timeSlots = {
            "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
            "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
        };
        
        for (String timeSlot : timeSlots) {
            // Đếm số đăng ký đã APPROVED cho bác sĩ, ngày và khung giờ này
            Integer currentPatients = patientRegistrationRepository
                .countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                    doctorId, 
                    LocalDate.parse(appointmentDate),
                    timeSlot,
                    "APPROVED"
                );
            
            DoctorSlotDTO slot = new DoctorSlotDTO();
            slot.setDoctorId(doctorId);
            slot.setAppointmentDate(appointmentDate);
            slot.setTimeSlot(timeSlot);
            slot.setMaxPatients(10); // Mỗi khung giờ tối đa 10 bệnh nhân
            slot.setCurrentPatients(currentPatients != null ? currentPatients : 0);
            slot.setAvailable(currentPatients == null || currentPatients < 10);
            
            slots.add(slot);
        }
        
        return slots;
    }
    
    public boolean isSlotAvailable(Long doctorId, String appointmentDate, String timeSlot) {
        Integer currentPatients = patientRegistrationRepository
            .countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, 
                LocalDate.parse(appointmentDate),
                timeSlot,
                "APPROVED"
            );
        
        return currentPatients == null || currentPatients < 10;
    }
    
    // Method để lấy số thứ tự tiếp theo
    public Integer getNextQueueNumber(Long doctorId, LocalDate appointmentDate, String timeSlot) {
    Integer currentCount = patientRegistrationRepository
        .countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
            doctorId, 
            appointmentDate,
            timeSlot,
            "APPROVED"
        );
    return (currentCount != null ? currentCount : 0) + 1;
}
    
    // // Method cũ - giữ lại để không break code hiện tại, nhưng sẽ không dùng đến
    // public void incrementSlotPatients(Long doctorId, String appointmentDate, String timeSlot) {
    //     // Không làm gì cả vì giờ dùng patient_registrations trực tiếp
    //     System.out.println("⚠️ incrementSlotPatients is deprecated - using patient_registrations directly");
    // }
}