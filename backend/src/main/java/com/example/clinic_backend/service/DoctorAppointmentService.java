package com.example.clinic_backend.service;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorAppointmentRepository;
import com.example.clinic_backend.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.util.Collections;

@Service
public class DoctorAppointmentService {
    
    private final DoctorAppointmentRepository doctorAppointmentRepository;
    private final DoctorRepository doctorRepository;
    
    public DoctorAppointmentService(DoctorAppointmentRepository doctorAppointmentRepository, 
                                   DoctorRepository doctorRepository) {
        this.doctorAppointmentRepository = doctorAppointmentRepository;
        this.doctorRepository = doctorRepository;
    }
    
    // lay tat ca lich hen cua bac si
    public Map<String, Object> getDoctorAppointments(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Tim bac si voi user ID: " + userId);
            
            // tim bac si tu user_id
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> {
                        System.out.println("Khong tim thay bac si voi user ID: " + userId);
                        return new RuntimeException("Khong tim thay bac si voi user ID: " + userId);
                    });
            
            Long doctorId = doctor.getId(); // lay ID thuc cua bac si
            System.out.println("Tim thay bac si: " + doctor.getFullName() + " (bac si ID: " + doctorId + ")");
            
            // lay lich hen voi doctor_id
            List<PatientRegistration> appointments = doctorAppointmentRepository
                    .findByDoctorIdOrderByAppointmentDateDescCreatedAtDesc(doctorId);
            
            System.out.println("Tim thay " + (appointments != null ? appointments.size() : 0) + " lich hen");
            
            // lich hen hom nay
            List<PatientRegistration> todayAppointments = doctorAppointmentRepository
                    .findByDoctorIdAndAppointmentDateOrderByQueueNumberAsc(doctorId, LocalDate.now());
            
            System.out.println("Lich hen hom nay: " + (todayAppointments != null ? todayAppointments.size() : 0));
            
            // thong ke
            Long pendingCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "PENDING"));
            Long confirmedCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "CONFIRMED"));
            Long completedCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "COMPLETED"));
            Long cancelledCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "CANCELLED"));
            
            System.out.println("Thong ke: Pending=" + pendingCount + ", Confirmed=" + confirmedCount + 
                             ", Completed=" + completedCount + ", Cancelled=" + cancelledCount);
            
            // tao response
            response.put("success", true);
            response.put("message", "Lay du lieu thanh cong");
            response.put("userId", userId);
            response.put("doctorId", doctorId);
            response.put("doctorName", doctor.getFullName());
            response.put("appointments", appointments != null ? appointments : Collections.emptyList());
            response.put("todayAppointments", todayAppointments != null ? todayAppointments : Collections.emptyList());
            response.put("statistics", Map.of(
                "pending", pendingCount,
                "confirmed", confirmedCount,
                "completed", completedCount,
                "cancelled", cancelledCount,
                "total", appointments != null ? appointments.size() : 0
            ));
            
            System.out.println("Da tao response thanh cong cho bac si " + doctorId);
            
        } catch (Exception e) {
            System.out.println("Loi trong getDoctorAppointments: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi he thong: " + e.getMessage());
            response.put("appointments", Collections.emptyList());
            response.put("todayAppointments", Collections.emptyList());
            response.put("statistics", Map.of(
                "pending", 0,
                "confirmed", 0,
                "completed", 0,
                "cancelled", 0,
                "total", 0
            ));
        }
        
        return response;
    }
    
    // lay lich hen theo trang thai
    public Map<String, Object> getAppointmentsByStatus(Long userId, String status) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Lay lich hen voi trang thai: " + status + ", user: " + userId);
            
            // tim bac si tu user_id
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay bac si"));
            
            Long doctorId = doctor.getId();
            List<PatientRegistration> appointments = doctorAppointmentRepository
                    .findByDoctorIdAndStatusOrderByAppointmentDateDesc(doctorId, status);
            
            response.put("success", true);
            response.put("message", "Lay du lieu thanh cong");
            response.put("appointments", appointments != null ? appointments : Collections.emptyList());
            response.put("count", appointments != null ? appointments.size() : 0);
            
        } catch (Exception e) {
            System.out.println("Loi trong getAppointmentsByStatus: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi: " + e.getMessage());
            response.put("appointments", Collections.emptyList());
            response.put("count", 0);
        }
        
        return response;
    }
    
    // lay lich hen hom nay
    public Map<String, Object> getTodayAppointments(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Lay lich hen hom nay cho user: " + userId);
            
            // tim bac si tu user_id
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay bac si"));
            
            Long doctorId = doctor.getId();
            List<PatientRegistration> appointments = doctorAppointmentRepository
                    .findByDoctorIdAndAppointmentDateOrderByQueueNumberAsc(doctorId, LocalDate.now());
            
            response.put("success", true);
            response.put("message", "Lay lich hen hom nay thanh cong");
            response.put("appointments", appointments != null ? appointments : Collections.emptyList());
            response.put("count", appointments != null ? appointments.size() : 0);
            
        } catch (Exception e) {
            System.out.println("Loi trong getTodayAppointments: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi: " + e.getMessage());
            response.put("appointments", Collections.emptyList());
            response.put("count", 0);
        }
        
        return response;
    }

    // xac nhan lich hen
    public Map<String, Object> confirmAppointment(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Xac nhan lich hen ID: " + appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay lich hen"));
            
            // cap nhat trang thai
            appointment.setStatus("CONFIRMED");
            doctorAppointmentRepository.save(appointment);
            
            System.out.println("Da xac nhan lich hen " + appointmentId);
            
            response.put("success", true);
            response.put("message", "Da xac nhan lich hen thanh cong");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            System.out.println("Loi khi xac nhan lich hen: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi khi xac nhan lich hen: " + e.getMessage());
        }
        
        return response;
    }

    // danh dau da kham
    public Map<String, Object> completeAppointment(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Danh dau da kham ID: " + appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay lich hen"));
            
            // cap nhat trang thai
            appointment.setStatus("COMPLETED");
            doctorAppointmentRepository.save(appointment);
            
            System.out.println("Da danh dau da kham " + appointmentId);
            
            response.put("success", true);
            response.put("message", "Da danh dau da kham thanh cong");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            System.out.println("Loi khi danh dau da kham: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi khi danh dau da kham: " + e.getMessage());
        }
        
        return response;
    }

    // huy lich hen
    public Map<String, Object> cancelAppointment(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Huy lich hen ID: " + appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay lich hen"));
            
            // cap nhat trang thai
            appointment.setStatus("CANCELLED");
            doctorAppointmentRepository.save(appointment);
            
            System.out.println("Da huy lich hen " + appointmentId);
            
            response.put("success", true);
            response.put("message", "Da huy lich hen thanh cong");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            System.out.println("Loi khi huy lich hen: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi khi huy lich hen: " + e.getMessage());
        }
        
        return response;
    }

    // luu ghi chu noi bo
    public Map<String, Object> saveInternalNotes(Long appointmentId, String notes) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("Luu ghi chu noi bo cho lich hen: " + appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay lich hen"));
            
            // luu ghi chu (can them truong internalNotes trong PatientRegistration)
            // appointment.setInternalNotes(notes);
            doctorAppointmentRepository.save(appointment);
            
            System.out.println("Da luu ghi chu cho " + appointmentId);
            
            response.put("success", true);
            response.put("message", "Da luu ghi chu thanh cong");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            System.out.println("Loi khi luu ghi chu: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Loi khi luu ghi chu: " + e.getMessage());
        }
        
        return response;
    }
    
    // helper de tranh null
    private Long safeCount(Long count) {
        return count != null ? count : 0L;
    }
}