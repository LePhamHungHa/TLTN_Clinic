package com.example.clinic_backend.controller;

import com.example.clinic_backend.service.DoctorAppointmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor/appointments")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorAppointmentController {
    
    private static final Logger logger = LoggerFactory.getLogger(DoctorAppointmentController.class);
    private final DoctorAppointmentService doctorAppointmentService;
    
    public DoctorAppointmentController(DoctorAppointmentService doctorAppointmentService) {
        this.doctorAppointmentService = doctorAppointmentService;
    }
    
    // Lấy tất cả lịch hẹn của bác sĩ - NHẬN USER_ID
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getDoctorAppointments(
            @PathVariable Long userId) {
        
        logger.info("📞 GET /api/doctor/appointments/{} called (user ID)", userId);
        
        try {
            Map<String, Object> response = doctorAppointmentService.getDoctorAppointments(userId);
            logger.info("✅ Response for user {}: success={}", userId, response.get("success"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting appointments for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Lấy lịch hẹn theo trạng thái - NHẬN USER_ID
    @GetMapping("/{userId}/status/{status}")
    public ResponseEntity<Map<String, Object>> getAppointmentsByStatus(
            @PathVariable Long userId,
            @PathVariable String status) {
        
        logger.info("📞 GET /api/doctor/appointments/{}/status/{} called", userId, status);
        
        try {
            Map<String, Object> response = doctorAppointmentService.getAppointmentsByStatus(userId, status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting appointments by status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }
    
    // Lấy lịch hẹn hôm nay - NHẬN USER_ID
    @GetMapping("/{userId}/today")
    public ResponseEntity<Map<String, Object>> getTodayAppointments(
            @PathVariable Long userId) {
        
        logger.info("📞 GET /api/doctor/appointments/{}/today called", userId);
        
        try {
            Map<String, Object> response = doctorAppointmentService.getTodayAppointments(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting today appointments: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }

    // API test để kiểm tra kết nối
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testApi() {
        logger.info("🔧 Test API called");
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Doctor Appointments API is working!",
            "timestamp", System.currentTimeMillis()
        ));
    }

    // Xác nhận lịch hẹn
    @PutMapping("/{appointmentId}/confirm")
    public ResponseEntity<Map<String, Object>> confirmAppointment(
            @PathVariable Long appointmentId) {
        
        logger.info("📞 PUT /api/doctor/appointments/{}/confirm called", appointmentId);
        
        try {
            Map<String, Object> response = doctorAppointmentService.confirmAppointment(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error confirming appointment {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // Đánh dấu đã khám
    @PutMapping("/{appointmentId}/complete")
    public ResponseEntity<Map<String, Object>> completeAppointment(
            @PathVariable Long appointmentId) {
        
        logger.info("📞 PUT /api/doctor/appointments/{}/complete called", appointmentId);
        
        try {
            Map<String, Object> response = doctorAppointmentService.completeAppointment(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error completing appointment {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // Hủy lịch hẹn
    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelAppointment(
            @PathVariable Long appointmentId) {
        
        logger.info("📞 PUT /api/doctor/appointments/{}/cancel called", appointmentId);
        
        try {
            Map<String, Object> response = doctorAppointmentService.cancelAppointment(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error cancelling appointment {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // Lưu ghi chú nội bộ
    @PutMapping("/{appointmentId}/notes")
    public ResponseEntity<Map<String, Object>> saveInternalNotes(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> request) {
        
        logger.info("📞 PUT /api/doctor/appointments/{}/notes called", appointmentId);
        
        try {
            String notes = request.get("notes");
            Map<String, Object> response = doctorAppointmentService.saveInternalNotes(appointmentId, notes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error saving notes for appointment {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
}