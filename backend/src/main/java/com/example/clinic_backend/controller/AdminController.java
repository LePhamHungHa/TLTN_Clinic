// AdminController.java
package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.service.PatientRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {
    
    @Autowired
    private PatientRegistrationService registrationService;

    @Autowired
    private PaymentRepository paymentRepository; // Thêm dependency này

    // API 1: Lấy tất cả đơn đăng ký VỚI DOCTOR INFO
    @GetMapping("/registrations")
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        System.out.println("=== 🚀 ADMIN CONTROLLER - GET ALL REGISTRATIONS ===");
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName() + " | Roles: " + auth.getAuthorities());
            
            // SỬ DỤNG METHOD MỚI - với doctor info
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            
            System.out.println("✅ Successfully retrieved " + registrations.size() + " registrations with doctor info");
            
            // Log sample data để verify
            if (!registrations.isEmpty()) {
                PatientRegistration sample = registrations.get(0);
                System.out.println("📋 Sample - ID: " + sample.getId() + 
                                 ", Name: " + sample.getFullName() + 
                                 ", Doctor: " + (sample.getDoctor() != null ? sample.getDoctor().getFullName() : "NULL"));
            }
            
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAllRegistrations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // API 2: Lấy thống kê đơn đăng ký - DÙNG METHOD CŨ (không cần doctor info)
    @GetMapping("/registrations/stats")
    public ResponseEntity<Map<String, Object>> getRegistrationStats() {
        System.out.println("=== 📊 ADMIN CONTROLLER - GET STATS ===");
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName() + " | Getting stats");
            
            // DÙNG METHOD CŨ - chỉ cần count, không cần doctor info
            List<PatientRegistration> allRegistrations = registrationService.getAll();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("TOTAL", allRegistrations.size());
            stats.put("APPROVED", allRegistrations.stream()
                .filter(r -> "APPROVED".equals(r.getStatus()))
                .count());
            stats.put("PENDING", allRegistrations.stream()
                .filter(r -> "PENDING".equals(r.getStatus()))
                .count());
            stats.put("NEEDS_MANUAL_REVIEW", allRegistrations.stream()
                .filter(r -> "NEEDS_MANUAL_REVIEW".equals(r.getStatus()))
                .count());
            stats.put("REJECTED", allRegistrations.stream()
                .filter(r -> "REJECTED".equals(r.getStatus()))
                .count());
            
            System.out.println("📈 Stats: " + stats);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getRegistrationStats: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // API 3: Thử duyệt đơn thủ công
    @PostMapping("/registrations/{id}/try-approve")
    public ResponseEntity<?> tryApproveRegistration(@PathVariable Long id) {
        System.out.println("=== ✅ ADMIN TRY APPROVE ===");
        System.out.println("🔍 Registration ID: " + id);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName());
            
            PatientRegistration approved = registrationService.tryApproveRegistration(id);
            
            System.out.println("✅ Successfully approved: ID=" + approved.getId() + 
                             ", Status=" + approved.getStatus() + 
                             ", Queue=" + approved.getQueueNumber());
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.err.println("❌ Error in tryApproveRegistration: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 4: Từ chối đơn
    @PostMapping("/registrations/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody String reason) {
        System.out.println("=== ❌ ADMIN REJECT ===");
        System.out.println("🔍 Registration ID: " + id + ", Reason: " + reason);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName());
            
            PatientRegistration rejected = registrationService.rejectRegistration(id, reason);
            
            System.out.println("✅ Successfully rejected: ID=" + rejected.getId() + 
                             ", New Status=" + rejected.getStatus());
            
            return ResponseEntity.ok(rejected);
            
        } catch (Exception e) {
            System.err.println("❌ Error in rejectRegistration: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 5: Đánh dấu cần xử lý thủ công
    @PutMapping("/registrations/{id}/manual-review")
    public ResponseEntity<?> markForManualReview(@PathVariable Long id) {
        System.out.println("=== 🔄 ADMIN MANUAL REVIEW ===");
        System.out.println("🔍 Registration ID: " + id);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName());
            
            PatientRegistration registration = registrationService.getById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đăng ký"));
            
            System.out.println("📝 Found: " + registration.getFullName() + 
                             " | Current Status: " + registration.getStatus());
            
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            PatientRegistration updated = registrationService.update(registration);
            
            System.out.println("✅ Marked for manual review: ID=" + updated.getId() + 
                             " | New Status: " + updated.getStatus());
            
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            System.err.println("❌ Error in markForManualReview: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 6: Lấy trạng thái thanh toán của đơn đăng ký - THÊM VÀO ĐÂY
    @GetMapping("/registrations/{registrationId}/payment-status")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable Long registrationId) {
        System.out.println("=== 💰 ADMIN GET PAYMENT STATUS ===");
        System.out.println("🔍 Registration ID: " + registrationId);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName() + " | Getting payment status");
            
            // Tìm payment theo patient_registration_id
            Optional<Payment> paymentOpt = paymentRepository.findByPatientRegistrationId(registrationId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                result.put("paymentStatus", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("paymentDate", payment.getUpdatedAt());
                
                System.out.println("💰 Payment found - Status: " + payment.getStatus() + 
                                 ", Amount: " + payment.getAmount());
            } else {
                result.put("paymentStatus", "Chưa thanh toán");
                result.put("amount", null);
                result.put("paymentDate", null);
                
                System.out.println("💰 No payment found for registration: " + registrationId);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getPaymentStatus: " + e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("paymentStatus", "Chưa thanh toán");
            errorResult.put("amount", null);
            errorResult.put("paymentDate", null);
            return ResponseEntity.ok(errorResult);
        }
    }

    // DEBUG ENDPOINT: Kiểm tra kết nối
    @GetMapping("/debug/test")
    public ResponseEntity<Map<String, String>> debugTest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin debug endpoint working");
        response.put("user", auth.getName());
        response.put("authenticated", String.valueOf(auth.isAuthenticated()));
        response.put("authorities", auth.getAuthorities().toString());
        
        System.out.println("🔍 Debug Response: " + response);
        return ResponseEntity.ok(response);
    }
}