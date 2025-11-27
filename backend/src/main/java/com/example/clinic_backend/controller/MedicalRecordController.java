package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.MedicalRecord;
import com.example.clinic_backend.service.MedicalRecordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor/medical-records")
@CrossOrigin(origins = "http://localhost:5173")
public class MedicalRecordController {
    
    private static final Logger logger = LoggerFactory.getLogger(MedicalRecordController.class);
    private final MedicalRecordService medicalRecordService;
    
    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }
    
    // Bắt đầu khám bệnh - ĐÃ THÊM LOGGING CHI TIẾT
    @PostMapping("/{appointmentId}/start")
    public ResponseEntity<Map<String, Object>> startExamination(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, Long> request,
            HttpServletRequest httpRequest) {
        
        logger.info("📞 POST /api/doctor/medical-records/{}/start called", appointmentId);
        
        // Log chi tiết request
        String authHeader = httpRequest.getHeader("Authorization");
        logger.info("🔐 Authorization header: {}", authHeader != null ? "Present" : "Missing");
        logger.info("👤 Remote User: {}", httpRequest.getRemoteUser());
        logger.info("🔒 User Principal: {}", httpRequest.getUserPrincipal());
        
        try {
            Long doctorId = request.get("doctorId");
            logger.info("🩺 Doctor ID from request: {}", doctorId);
            logger.info("📅 Appointment ID: {}", appointmentId);
            
            if (doctorId == null) {
                logger.warn("❌ Doctor ID is null in request");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Doctor ID is required"
                ));
            }
            
            Map<String, Object> response = medicalRecordService.startExamination(appointmentId, doctorId);
            logger.info("✅ Start examination response: {}", response.get("success"));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error starting examination: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Lưu kết quả khám
    @PutMapping("/{appointmentId}")
    public ResponseEntity<Map<String, Object>> saveMedicalRecord(
            @PathVariable Long appointmentId,
            @RequestBody MedicalRecord medicalRecord) {
        
        logger.info("📞 PUT /api/doctor/medical-records/{} called", appointmentId);
        
        try {
            medicalRecord.setAppointmentId(appointmentId);
            Map<String, Object> response = medicalRecordService.saveMedicalRecord(medicalRecord);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error saving medical record: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Hoàn thành khám
    @PutMapping("/{appointmentId}/complete")
    public ResponseEntity<Map<String, Object>> completeExamination(
            @PathVariable Long appointmentId) {
        
        logger.info("📞 PUT /api/doctor/medical-records/{}/complete called", appointmentId);
        
        try {
            Map<String, Object> response = medicalRecordService.completeExamination(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error completing examination: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Đánh dấu không đi khám
    @PutMapping("/{appointmentId}/missed")
    public ResponseEntity<Map<String, Object>> markAsMissed(
            @PathVariable Long appointmentId) {
        
        logger.info("📞 PUT /api/doctor/medical-records/{}/missed called", appointmentId);
        
        try {
            Map<String, Object> response = medicalRecordService.markAsMissed(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error marking as missed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    // Lấy chi tiết khám
    @GetMapping("/{appointmentId}")
    public ResponseEntity<Map<String, Object>> getExaminationDetail(
            @PathVariable Long appointmentId) {
        
        logger.info("📞 GET /api/doctor/medical-records/{} called", appointmentId);
        
        try {
            Map<String, Object> response = medicalRecordService.getExaminationDetail(appointmentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting examination detail: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
}