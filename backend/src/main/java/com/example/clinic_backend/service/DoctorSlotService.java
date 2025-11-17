package com.example.clinic_backend.service;

import com.example.clinic_backend.dto.DoctorSlotDTO;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            slot.setMaxPatients(10);
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
    
    // QUAN TRỌNG: Method mới với LOCK để tránh race condition
    @Transactional
    public Integer getNextQueueNumberWithLock(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("🔒 Getting next queue number WITH LOCK for doctor: " + doctorId + 
                             ", date: " + appointmentDate + ", session: " + timeSlot);
            
            // Sử dụng method có LOCK để tránh trùng số
            Integer currentCount = patientRegistrationRepository.countApprovedRegistrationsWithLock(
                doctorId, appointmentDate, timeSlot
            );
            
            int nextQueue = (currentCount != null ? currentCount : 0) + 1;
            
            System.out.println("🎯 Current count: " + currentCount + ", Next queue: " + nextQueue);
            
            // DEBUG: Kiểm tra xem có đơn trùng không
            List<PatientRegistration> existingRegistrations = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, appointmentDate, timeSlot);
            
            if (!existingRegistrations.isEmpty()) {
                System.out.println("📋 Existing registrations in this slot:");
                existingRegistrations.forEach(reg -> {
                    System.out.println("   - ID: " + reg.getId() + ", Queue: " + reg.getQueueNumber() + 
                                     ", Name: " + reg.getFullName());
                });
            }
            
            return nextQueue;
        } catch (Exception e) {
            System.err.println("❌ Error getting next queue number with lock: " + e.getMessage());
            e.printStackTrace();
            // Fallback: sử dụng method không lock
            return getNextQueueNumber(doctorId, appointmentDate, timeSlot);
        }
    }
    
    // Method fallback không dùng lock
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
}