package com.example.clinic_backend.controller;

import com.example.clinic_backend.service.PrescriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor/prescriptions")
@CrossOrigin(origins = "http://localhost:5173")
public class PrescriptionController {
    
    private final PrescriptionService prescriptionService;
    
    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    
    @PostMapping("/create/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createPrescription(
            @PathVariable Long medicalRecordId,
            @RequestBody List<Map<String, Object>> prescriptionItems) {
        
        System.out.println("Tao don thuoc cho medical record: " + medicalRecordId);
        System.out.println("So luong thuoc: " + (prescriptionItems != null ? prescriptionItems.size() : 0));
        
        try {
            // kiem tra du lieu
            if (medicalRecordId == null || medicalRecordId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Medical Record ID khong hop le"
                ));
            }
            
            if (prescriptionItems == null || prescriptionItems.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Danh sach thuoc khong duoc rong"
                ));
            }
            
            Map<String, Object> response = prescriptionService.createPrescription(medicalRecordId, prescriptionItems);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.out.println("Loi tao don thuoc: " + e.getMessage());
            
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Loi khi tao don thuoc: " + e.getMessage()
            );
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    @GetMapping("/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> getPrescription(
            @PathVariable Long medicalRecordId) {
        
        System.out.println("Lay don thuoc theo medical record: " + medicalRecordId);
        
        try {
            Map<String, Object> response = prescriptionService.getPrescriptionByMedicalRecord(medicalRecordId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Loi lay don thuoc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/history/{medicalRecordId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMedicationHistoryByMedicalRecord(
        @PathVariable Long medicalRecordId) {
    
        System.out.println("Lay lich su thuoc theo medical record: " + medicalRecordId);
        
        try {
            if (medicalRecordId == null || medicalRecordId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Medical Record ID khong hop le"
                ));
            }
            
            Map<String, Object> response = prescriptionService.getMedicationHistoryByMedicalRecord(medicalRecordId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.out.println("Loi lay lich su thuoc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientMedicationHistory(
            @PathVariable Long patientId) {
        
        System.out.println("Lay lich su thuoc cua benh nhan: " + patientId);
        
        try {
            if (patientId == null || patientId <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Patient ID khong hop le"
                ));
            }
            
            Map<String, Object> response = prescriptionService.getPatientMedicationHistory(patientId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.out.println("Loi lay lich su benh nhan: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/search")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> searchMedicines(
            @RequestParam(required = false) String keyword) {
        
        System.out.println("Tim kiem thuoc: " + keyword);
        
        try {
            Map<String, Object> response = prescriptionService.searchMedicines(keyword != null ? keyword : "");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Loi tim kiem thuoc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/active")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getActiveMedicines() {
        
        System.out.println("Lay thuoc dang hoat dong");
        
        try {
            Map<String, Object> response = prescriptionService.getActiveMedicines();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Loi lay thuoc hoat dong: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/category/{category}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMedicinesByCategory(
            @PathVariable String category) {
        
        System.out.println("Lay thuoc theo danh muc: " + category);
        
        try {
            Map<String, Object> response = prescriptionService.getMedicinesByCategory(category);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Loi lay thuoc theo danh muc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/categories")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMedicineCategories() {
        
        System.out.println("Lay danh muc thuoc");
        
        try {
            Map<String, Object> response = prescriptionService.getMedicineCategories();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Loi lay danh muc thuoc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/medicines/all")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getAllMedicines() {
        
        System.out.println("Lay tat ca thuoc");
        
        try {
            Map<String, Object> response = prescriptionService.getActiveMedicines();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Loi lay tat ca thuoc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Loi server: " + e.getMessage()
            ));
        }
    }
}