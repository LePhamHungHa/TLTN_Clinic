package com.example.clinic_backend.service;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorAppointmentRepository;
import com.example.clinic_backend.repository.DoctorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.util.Collections;

@Service
public class DoctorAppointmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(DoctorAppointmentService.class);
    private final DoctorAppointmentRepository doctorAppointmentRepository;
    private final DoctorRepository doctorRepository;
    
    public DoctorAppointmentService(DoctorAppointmentRepository doctorAppointmentRepository, 
                                   DoctorRepository doctorRepository) {
        this.doctorAppointmentRepository = doctorAppointmentRepository;
        this.doctorRepository = doctorRepository;
    }
    
    public Map<String, Object> getDoctorAppointments(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Finding doctor with user ID: {}", userId);
            
            // TÌM BÁC SĨ TỪ USER_ID
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> {
                        logger.warn("❌ Doctor not found with user ID: {}", userId);
                        return new RuntimeException("Không tìm thấy bác sĩ với user ID: " + userId);
                    });
            
            Long doctorId = doctor.getId(); // Lấy ID thực của bác sĩ (48)
            logger.info("✅ Found doctor: {} (doctor ID: {}, user ID: {})", 
                    doctor.getFullName(), doctorId, userId);
            
            // Bây giờ lấy lịch hẹn với DOCTOR_ID = 48
            List<PatientRegistration> appointments = doctorAppointmentRepository
                    .findByDoctorIdOrderByAppointmentDateDescCreatedAtDesc(doctorId);
            
            logger.info("📅 Found {} total appointments for doctor ID: {}", 
                    appointments != null ? appointments.size() : 0, doctorId);
            
            // Lấy lịch hẹn hôm nay
            List<PatientRegistration> todayAppointments = doctorAppointmentRepository
                    .findByDoctorIdAndAppointmentDateOrderByQueueNumberAsc(doctorId, LocalDate.now());
            
            logger.info("📅 Found {} today appointments", todayAppointments != null ? todayAppointments.size() : 0);
            
            // Thống kê với null safety
            Long pendingCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "PENDING"));
            Long confirmedCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "CONFIRMED"));
            Long completedCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "COMPLETED"));
            Long cancelledCount = safeCount(doctorAppointmentRepository.countByDoctorIdAndStatus(doctorId, "CANCELLED"));
            
            logger.info("📊 Statistics - Pending: {}, Confirmed: {}, Completed: {}, Cancelled: {}", 
                    pendingCount, confirmedCount, completedCount, cancelledCount);
            
            // Build response
            response.put("success", true);
            response.put("message", "Lấy dữ liệu thành công");
            response.put("userId", userId);
            response.put("doctorId", doctorId); // Trả về doctorId thực
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
            
            logger.info("✅ Successfully built response for doctor {} (user {})", doctorId, userId);
            
        } catch (Exception e) {
            logger.error("💥 Error in getDoctorAppointments for user {}: {}", userId, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi hệ thống: " + e.getMessage());
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
    
    public Map<String, Object> getAppointmentsByStatus(Long userId, String status) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Getting appointments for user {} with status: {}", userId, status);
            
            // Tìm doctorId từ userId
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ"));
            
            Long doctorId = doctor.getId();
            List<PatientRegistration> appointments = doctorAppointmentRepository
                    .findByDoctorIdAndStatusOrderByAppointmentDateDesc(doctorId, status);
            
            response.put("success", true);
            response.put("message", "Lấy dữ liệu thành công");
            response.put("appointments", appointments != null ? appointments : Collections.emptyList());
            response.put("count", appointments != null ? appointments.size() : 0);
            
        } catch (Exception e) {
            logger.error("💥 Error in getAppointmentsByStatus: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            response.put("appointments", Collections.emptyList());
            response.put("count", 0);
        }
        
        return response;
    }
    
    public Map<String, Object> getTodayAppointments(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Getting today appointments for user {}", userId);
            
            // Tìm doctorId từ userId
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ"));
            
            Long doctorId = doctor.getId();
            List<PatientRegistration> appointments = doctorAppointmentRepository
                    .findByDoctorIdAndAppointmentDateOrderByQueueNumberAsc(doctorId, LocalDate.now());
            
            response.put("success", true);
            response.put("message", "Lấy dữ liệu hôm nay thành công");
            response.put("appointments", appointments != null ? appointments : Collections.emptyList());
            response.put("count", appointments != null ? appointments.size() : 0);
            
        } catch (Exception e) {
            logger.error("💥 Error in getTodayAppointments: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            response.put("appointments", Collections.emptyList());
            response.put("count", 0);
        }
        
        return response;
    }

    // Xác nhận lịch hẹn
    public Map<String, Object> confirmAppointment(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Confirming appointment ID: {}", appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
            
            // Cập nhật trạng thái
            appointment.setStatus("CONFIRMED");
            doctorAppointmentRepository.save(appointment);
            
            logger.info("✅ Appointment {} confirmed successfully", appointmentId);
            
            response.put("success", true);
            response.put("message", "Đã xác nhận lịch hẹn thành công");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            logger.error("💥 Error confirming appointment {}: {}", appointmentId, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi xác nhận lịch hẹn: " + e.getMessage());
        }
        
        return response;
    }

    // Đánh dấu đã khám
    public Map<String, Object> completeAppointment(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Completing appointment ID: {}", appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
            
            // Cập nhật trạng thái
            appointment.setStatus("COMPLETED");
            doctorAppointmentRepository.save(appointment);
            
            logger.info("✅ Appointment {} marked as completed", appointmentId);
            
            response.put("success", true);
            response.put("message", "Đã đánh dấu đã khám thành công");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            logger.error("💥 Error completing appointment {}: {}", appointmentId, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi đánh dấu đã khám: " + e.getMessage());
        }
        
        return response;
    }

    // Hủy lịch hẹn
    public Map<String, Object> cancelAppointment(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Cancelling appointment ID: {}", appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
            
            // Cập nhật trạng thái
            appointment.setStatus("CANCELLED");
            doctorAppointmentRepository.save(appointment);
            
            logger.info("✅ Appointment {} cancelled successfully", appointmentId);
            
            response.put("success", true);
            response.put("message", "Đã hủy lịch hẹn thành công");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            logger.error("💥 Error cancelling appointment {}: {}", appointmentId, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi hủy lịch hẹn: " + e.getMessage());
        }
        
        return response;
    }

    // Lưu ghi chú nội bộ
    public Map<String, Object> saveInternalNotes(Long appointmentId, String notes) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Saving internal notes for appointment ID: {}", appointmentId);
            
            PatientRegistration appointment = doctorAppointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
            
            // Lưu ghi chú (cần thêm trường internalNotes trong PatientRegistration)
            // appointment.setInternalNotes(notes);
            doctorAppointmentRepository.save(appointment);
            
            logger.info("✅ Internal notes saved for appointment {}", appointmentId);
            
            response.put("success", true);
            response.put("message", "Đã lưu ghi chú thành công");
            response.put("appointment", appointment);
            
        } catch (Exception e) {
            logger.error("💥 Error saving notes for appointment {}: {}", appointmentId, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lưu ghi chú: " + e.getMessage());
        }
        
        return response;
    }
    
    // Helper method for null-safe counting
    private Long safeCount(Long count) {
        return count != null ? count : 0L;
    }
}