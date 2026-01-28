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
@CrossOrigin(origins = {"http://localhost:5173"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
                       RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true",
             maxAge = 3600)
public class AdminStructureController {
    
    @Autowired
    private DoctorSlotService doctorSlotService;
    
    
    // ========== DOCTOR SLOT MANAGEMENT ==========
    
    // lay tat ca slot
    @GetMapping("/slots")
    public ResponseEntity<List<DoctorSlot>> getAllSlots() {
    List<DoctorSlot> slots = doctorSlotService.getAllSlots();
    return ResponseEntity.ok(slots);
    }
    
    // lay slot theo bac si
    @GetMapping("/slots/doctor/{doctorId}")
    public ResponseEntity<List<DoctorSlot>> getSlotsByDoctor(@PathVariable Long doctorId) {
    List<DoctorSlot> slots = doctorSlotService.getSlotsByDoctor(doctorId);
    return ResponseEntity.ok(slots);
    }
    
    // lay slot sap toi
    @GetMapping("/slots/upcoming")
    public ResponseEntity<List<DoctorSlot>> getUpcomingSlots() {
    List<DoctorSlot> slots = doctorSlotService.getUpcomingSlots();
    return ResponseEntity.ok(slots);
    }
    
    // lay slot theo id
    @GetMapping("/slots/{id}")
    public ResponseEntity<DoctorSlot> getSlotById(@PathVariable Long id) {
    DoctorSlot slot = doctorSlotService.getSlotById(id);
    return ResponseEntity.ok(slot);
    }
    
    // tao slot moi
    @PostMapping("/slots")
    public ResponseEntity<DoctorSlot> createSlot(@RequestBody DoctorSlot slot) {
    DoctorSlot newSlot = doctorSlotService.createSlot(slot);
    return ResponseEntity.ok(newSlot);
    }
    
    // cap nhat slot
    @PutMapping("/slots/{id}")
    public ResponseEntity<DoctorSlot> updateSlot(@PathVariable Long id, @RequestBody DoctorSlot slotDetails) {
    DoctorSlot updated = doctorSlotService.updateSlot(id, slotDetails);
    return ResponseEntity.ok(updated);
    }
    
    // cap nhat so benh nhan toi da
    @PatchMapping("/slots/{id}/max-patients")
    public ResponseEntity<DoctorSlot> updateMaxPatients(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
    Integer maxPatients = request.get("maxPatients");
    DoctorSlot updated = doctorSlotService.updateMaxPatients(id, maxPatients);
    return ResponseEntity.ok(updated);
    }
    
    // cap nhat hang loat so benh nhan
    @PatchMapping("/slots/bulk-max-patients")
    public ResponseEntity<Map<String, String>> bulkUpdateMaxPatients(@RequestBody Map<String, Integer> request) {
    Integer maxPatients = request.get("maxPatients");
    doctorSlotService.bulkUpdateMaxPatients(maxPatients);
    
    Map<String, String> response = new HashMap<>();
    response.put("message", "Da cap nhat thanh cong cho tat ca slot");
    return ResponseEntity.ok(response);
    }
    
    // xoa slot
    @DeleteMapping("/slots/{id}")
    public ResponseEntity<Map<String, String>> deleteSlot(@PathVariable Long id) {
    doctorSlotService.deleteSlot(id);
    
    Map<String, String> response = new HashMap<>();
    response.put("message", "Xoa slot thanh cong");
    return ResponseEntity.ok(response);
    }
    
    
    // them mot vai method don gian de test
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
    Map<String, String> result = new HashMap<>();
    result.put("status", "ok");
    result.put("message", "api dang chay");
    return ResponseEntity.ok(result);
    }
    
    // lay so luong slot
    @GetMapping("/slots/count")
    public ResponseEntity<Map<String, Integer>> countSlots() {
    List<DoctorSlot> all = doctorSlotService.getAllSlots();
    Map<String, Integer> result = new HashMap<>();
    result.put("count", all.size());
    return ResponseEntity.ok(result);
    }
}