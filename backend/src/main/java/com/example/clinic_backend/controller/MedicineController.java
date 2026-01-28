package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Medicine;
import com.example.clinic_backend.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/structure/medicines") 
@CrossOrigin(origins = {"http://localhost:5173"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
                       RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true",
             maxAge = 3600)
public class MedicineController {
    
    @Autowired
    private MedicineService medicineService;
    
    
    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Medicine>> getActiveMedicines() {
        return ResponseEntity.ok(medicineService.getActiveMedicines());
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getMedicineCategories() {
        return ResponseEntity.ok(medicineService.getAllCategories());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }
    
    
    @PostMapping
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        return ResponseEntity.ok(medicineService.createMedicine(medicine));
    }
    
    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importMedicines(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File không được để trống");
                return ResponseEntity.badRequest().body(response);
            }
            
            String fileName = file.getOriginalFilename();
            if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))) {
                response.put("success", false);
                response.put("message", "Chỉ hỗ trợ file Excel (.xlsx, .xls)");
                return ResponseEntity.badRequest().body(response);
            }
            
            medicineService.importFromExcel(file);
            
            response.put("success", true);
            response.put("message", "Import thuốc thành công");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Import thất bại: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    
    @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicineDetails) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, medicineDetails));
    }
    
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Medicine> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        Integer quantity = request.get("quantity");
        return ResponseEntity.ok(medicineService.updateStock(id, quantity));
    }
    
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Map<String, String>> toggleMedicineStatus(@PathVariable Long id) {
        medicineService.toggleStatus(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cập nhật trạng thái thành công");
        return ResponseEntity.ok(response);
    }
    
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Xóa thuốc thành công");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}