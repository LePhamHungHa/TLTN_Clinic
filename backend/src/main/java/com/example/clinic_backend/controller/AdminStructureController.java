package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.DoctorSlot;
import com.example.clinic_backend.model.Medicine;
import com.example.clinic_backend.service.DoctorSlotService;
import com.example.clinic_backend.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/structure")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
                       RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true",
             maxAge = 3600)
public class AdminStructureController {
    
    @Autowired
    private DoctorSlotService doctorSlotService;
    
    @Autowired
    private MedicineService medicineService;
    
    // ========== DOCTOR SLOT MANAGEMENT ==========
    
    @GetMapping("/slots")
    public ResponseEntity<List<DoctorSlot>> getAllSlots() {
        return ResponseEntity.ok(doctorSlotService.getAllSlots());
    }
    
    @GetMapping("/slots/doctor/{doctorId}")
    public ResponseEntity<List<DoctorSlot>> getSlotsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorSlotService.getSlotsByDoctor(doctorId));
    }
    
    @GetMapping("/slots/upcoming")
    public ResponseEntity<List<DoctorSlot>> getUpcomingSlots() {
        return ResponseEntity.ok(doctorSlotService.getUpcomingSlots());
    }
    
    @GetMapping("/slots/{id}")
    public ResponseEntity<DoctorSlot> getSlotById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorSlotService.getSlotById(id));
    }
    
    @PostMapping("/slots")
    public ResponseEntity<DoctorSlot> createSlot(@RequestBody DoctorSlot slot) {
        return ResponseEntity.ok(doctorSlotService.createSlot(slot));
    }
    
    @PutMapping("/slots/{id}")
    public ResponseEntity<DoctorSlot> updateSlot(@PathVariable Long id, @RequestBody DoctorSlot slotDetails) {
        return ResponseEntity.ok(doctorSlotService.updateSlot(id, slotDetails));
    }
    
    @PatchMapping("/slots/{id}/max-patients")
    public ResponseEntity<DoctorSlot> updateMaxPatients(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        Integer maxPatients = request.get("maxPatients");
        return ResponseEntity.ok(doctorSlotService.updateMaxPatients(id, maxPatients));
    }
    
    @PatchMapping("/slots/bulk-max-patients")
    public ResponseEntity<Map<String, String>> bulkUpdateMaxPatients(@RequestBody Map<String, Integer> request) {
        Integer maxPatients = request.get("maxPatients");
        doctorSlotService.bulkUpdateMaxPatients(maxPatients);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cập nhật thành công cho tất cả slot");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/slots/{id}")
    public ResponseEntity<Map<String, String>> deleteSlot(@PathVariable Long id) {
        doctorSlotService.deleteSlot(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Xóa slot thành công");
        return ResponseEntity.ok(response);
    }
    
    // ========== MEDICINE MANAGEMENT ==========
    
    @GetMapping("/medicines")
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }
    
    @GetMapping("/medicines/active")
    public ResponseEntity<List<Medicine>> getActiveMedicines() {
        return ResponseEntity.ok(medicineService.getActiveMedicines());
    }
    
    @GetMapping("/medicines/categories")
    public ResponseEntity<List<String>> getMedicineCategories() {
        return ResponseEntity.ok(medicineService.getAllCategories());
    }
    
    @GetMapping("/medicines/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }
    
    @PostMapping("/medicines")
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        return ResponseEntity.ok(medicineService.createMedicine(medicine));
    }
    
    @PutMapping("/medicines/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicineDetails) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, medicineDetails));
    }
    
    @PatchMapping("/medicines/{id}/stock")
    public ResponseEntity<Medicine> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        Integer quantity = request.get("quantity");
        return ResponseEntity.ok(medicineService.updateStock(id, quantity));
    }
    
    @PatchMapping("/medicines/{id}/toggle-status")
    public ResponseEntity<Map<String, String>> toggleMedicineStatus(@PathVariable Long id) {
        medicineService.toggleStatus(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cập nhật trạng thái thành công");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/medicines/{id}")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Xóa thuốc thành công");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/medicines/import")
    public ResponseEntity<Map<String, Object>> importMedicines(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File không được để trống");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check file type
            String fileName = file.getOriginalFilename();
            if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))) {
                response.put("success", false);
                response.put("message", "Chỉ hỗ trợ file Excel (.xlsx, .xls)");
                return ResponseEntity.badRequest().body(response);
            }
            
            medicineService.importFromExcel(file);
            
            response.put("success", true);
            response.put("message", "Import thành công");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Import thất bại: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // ========== HEALTH CHECK ==========
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}