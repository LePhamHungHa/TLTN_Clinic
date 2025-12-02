package com.example.clinic_backend.controller;

import com.example.clinic_backend.service.PrescriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor/prescriptions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PrescriptionController {
    
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionController.class);
    private final PrescriptionService prescriptionService;
    
    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    
    @PostMapping("/create/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> createPrescription(
            @PathVariable Long medicalRecordId,
            @RequestBody List<Map<String, Object>> prescriptionItems) {
        
        logger.info("📞 POST /api/doctor/prescriptions/create/{} called", medicalRecordId);
        logger.info("📦 Request body size: {}", prescriptionItems != null ? prescriptionItems.size() : 0);
        
        try {
            // Validate request
            if (medicalRecordId == null || medicalRecordId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Medical Record ID không hợp lệ"
                ));
            }
            
            if (prescriptionItems == null || prescriptionItems.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Danh sách thuốc không được rỗng"
                ));
            }
            
            Map<String, Object> response = prescriptionService.createPrescription(medicalRecordId, prescriptionItems);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Error creating prescription for medical record {}: {}", medicalRecordId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Lỗi khi tạo đơn thuốc: " + e.getMessage(),
                "error", e.toString()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPrescription(
            @PathVariable Long medicalRecordId) {
        
        logger.info("📞 GET /api/doctor/prescriptions/{} called", medicalRecordId);
        
        try {
            Map<String, Object> response = prescriptionService.getPrescriptionByMedicalRecord(medicalRecordId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting prescription: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/history/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getMedicationHistoryByMedicalRecord(
        @PathVariable Long medicalRecordId) {
    
        logger.info("📞 GET /api/doctor/prescriptions/history/{} called", medicalRecordId);
        
        try {
            if (medicalRecordId == null || medicalRecordId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Medical Record ID không hợp lệ"
                ));
            }
            
            Map<String, Object> response = prescriptionService.getMedicationHistoryByMedicalRecord(medicalRecordId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Error getting medication history by medical record: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getPatientMedicationHistory(
            @PathVariable Long patientId) {
        
        logger.info("📞 GET /api/doctor/prescriptions/patient/{}/history called", patientId);
        
        try {
            if (patientId == null || patientId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Patient ID không hợp lệ"
                ));
            }
            
            Map<String, Object> response = prescriptionService.getPatientMedicationHistory(patientId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Error getting patient medication history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/search")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> searchMedicines(
            @RequestParam(required = false) String keyword) {
        
        logger.info("📞 GET /api/doctor/prescriptions/medicines/search called with keyword: {}", keyword);
        
        try {
            Map<String, Object> response = prescriptionService.searchMedicines(keyword != null ? keyword : "");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error searching medicines: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/active")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getActiveMedicines() {
        
        logger.info("📞 GET /api/doctor/prescriptions/medicines/active called");
        
        try {
            Map<String, Object> response = prescriptionService.getActiveMedicines();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting active medicines: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/category/{category}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getMedicinesByCategory(
            @PathVariable String category) {
        
        logger.info("📞 GET /api/doctor/prescriptions/medicines/category/{} called", category);
        
        try {
            Map<String, Object> response = prescriptionService.getMedicinesByCategory(category);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting medicines by category: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/categories")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getMedicineCategories() {
        
        logger.info("📞 GET /api/doctor/prescriptions/medicines/categories called");
        
        try {
            Map<String, Object> response = prescriptionService.getMedicineCategories();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting medicine categories: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/all")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getAllMedicines() {
        
        logger.info("📞 GET /api/doctor/prescriptions/medicines/all called");
        
        try {
            Map<String, Object> response = prescriptionService.getActiveMedicines();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error getting all medicines: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error: " + e.getMessage()
            ));
        }
    }
}