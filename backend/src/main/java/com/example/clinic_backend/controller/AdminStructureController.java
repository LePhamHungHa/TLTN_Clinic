package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.DoctorSlot;
import com.example.clinic_backend.service.DoctorSlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
}