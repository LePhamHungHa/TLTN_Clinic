package com.example.clinic_backend.controller;

import com.example.clinic_backend.dto.DoctorSlotDTO;
import com.example.clinic_backend.service.DoctorSlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SlotController {
    
    @Autowired
    private DoctorSlotService doctorSlotService;
    
    @GetMapping("/doctor-slots")
    public ResponseEntity<?> getDoctorSlots(
            @RequestParam Long doctorId,
            @RequestParam String appointmentDate) {
        try {
            List<DoctorSlotDTO> slots = doctorSlotService.getSlotsByDoctorAndDate(doctorId, appointmentDate);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi lấy danh sách slot: " + e.getMessage());
        }
    }
}