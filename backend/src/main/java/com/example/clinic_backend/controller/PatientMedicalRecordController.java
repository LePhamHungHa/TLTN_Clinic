package com.example.clinic_backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.clinic_backend.service.PatientMedicalRecordService;

@RestController
@RequestMapping("/api/patient/medical-records")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientMedicalRecordController {
    
    private static final Logger logger = LoggerFactory.getLogger(PatientMedicalRecordController.class);
    private final PatientMedicalRecordService patientMedicalRecordService;
    
    public PatientMedicalRecordController(PatientMedicalRecordService patientMedicalRecordService) {
        this.patientMedicalRecordService = patientMedicalRecordService;
    }
    
    // Lấy danh sách kết quả khám của bệnh nhân
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPatientMedicalRecords(
            @RequestParam Long patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        logger.info("GET /api/patient/medical-records called for patient: {}, page: {}, size: {}", 
                   patientId, page, size);
        
        try {
            Map<String, Object> response = patientMedicalRecordService.getMedicalRecordsByPatientId(patientId, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting patient medical records: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi khi lấy danh sách kết quả khám: " + e.getMessage()
            ));
        }
    }
    
    // Lấy chi tiết kết quả khám theo ID
    @GetMapping("/{recordId}")
    public ResponseEntity<Map<String, Object>> getMedicalRecordDetail(
            @PathVariable Long recordId,
            @RequestParam Long patientId) {
        
        logger.info("GET /api/patient/medical-records/{} called for patient: {}", recordId, patientId);
        
        try {
            Map<String, Object> response = patientMedicalRecordService.getMedicalRecordDetail(recordId, patientId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting medical record detail: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi khi lấy chi tiết kết quả khám: " + e.getMessage()
            ));
        }
    }
    
    // Tìm kiếm kết quả khám
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMedicalRecords(
            @RequestParam Long patientId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        logger.info("Search medical records for patient: {}, keyword: {}", patientId, keyword);
        
        try {
            Map<String, Object> response = patientMedicalRecordService.searchMedicalRecords(
                patientId, keyword, fromDate, toDate, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error searching medical records: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi khi tìm kiếm kết quả khám: " + e.getMessage()
            ));
        }
    }
}