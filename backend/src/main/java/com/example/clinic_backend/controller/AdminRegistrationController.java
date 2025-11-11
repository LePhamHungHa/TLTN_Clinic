// package com.example.clinic_backend.controller;

// import com.example.clinic_backend.model.PatientRegistration;
// import com.example.clinic_backend.service.PatientRegistrationService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/admin/registrations")
// @CrossOrigin(origins = "http://localhost:5173")
// @PreAuthorize("hasAuthority('ROLE_ADMIN')")
// public class AdminRegistrationController {

//     @Autowired
//     private PatientRegistrationService registrationService;

//     // Lấy danh sách đơn chờ admin phân loại
//     @GetMapping("/pending-review")
//     public ResponseEntity<List<PatientRegistration>> getPendingAdminReview() {
//         try {
//             List<PatientRegistration> pendingRegistrations = registrationService.getPendingAdminReview();
//             return ResponseEntity.ok(pendingRegistrations);
//         } catch (Exception e) {
//             return ResponseEntity.internalServerError().build();
//         }
//     }

//     // Admin phân loại tự động
//     @PostMapping("/{id}/auto-classify")
//     public ResponseEntity<?> autoClassify(@PathVariable Long id, @RequestBody Map<String, Long> request) {
//         try {
//             Long adminUserId = request.get("adminUserId");
//             PatientRegistration result = registrationService.adminAutoClassify(id, adminUserId);
//             return ResponseEntity.ok(result);
//         } catch (Exception e) {
//             return ResponseEntity.badRequest().body(e.getMessage());
//         }
//     }

//     // Admin phân loại thủ công
//     @PostMapping("/{id}/manual-classify")
//     public ResponseEntity<?> manualClassify(@PathVariable Long id, @RequestBody ManualClassificationRequest request) {
//         try {
//             PatientRegistration result = registrationService.adminManualClassify(
//                 id, request.getDoctorId(), request.getTimeSlot(), 
//                 request.getAdminUserId(), request.getNotes()
//             );
//             return ResponseEntity.ok(result);
//         } catch (Exception e) {
//             return ResponseEntity.badRequest().body(e.getMessage());
//         }
//     }
// }

// // DTO cho request
// class ManualClassificationRequest {
//     private Long adminUserId;
//     private Long doctorId;
//     private String timeSlot;
//     private String notes;
    
//     // Getters and Setters
//     public Long getAdminUserId() { return adminUserId; }
//     public void setAdminUserId(Long adminUserId) { this.adminUserId = adminUserId; }
    
//     public Long getDoctorId() { return doctorId; }
//     public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    
//     public String getTimeSlot() { return timeSlot; }
//     public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }
    
//     public String getNotes() { return notes; }
//     public void setNotes(String notes) { this.notes = notes; }
// }