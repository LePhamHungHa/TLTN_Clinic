package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.service.DoctorService;
import com.example.clinic_backend.service.PatientRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {
    
    @Autowired
    private PatientRegistrationService registrationService;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;

    // Thêm các constant
    private static final String[] TIME_SLOTS = {
        "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
        "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    };

    private static final int MAX_PATIENTS_PER_SLOT = 10;

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

    // API 3: Từ chối đơn
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

    // API 4: Đánh dấu cần xử lý thủ công
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

    // API 5: Lấy trạng thái thanh toán của đơn đăng ký
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

    // API MỚI: Lấy danh sách bác sĩ theo khoa
    @GetMapping("/doctors/by-department")
    public ResponseEntity<List<Doctor>> getDoctorsByDepartment(@RequestParam String department) {
        System.out.println("=== 👨‍⚕️ ADMIN GET DOCTORS BY DEPARTMENT ===");
        System.out.println("🔍 Department: " + department);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName() + " | Getting doctors for department");
            
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentName(department);
            
            System.out.println("✅ Found " + doctors.size() + " doctors in department: " + department);
            
            return ResponseEntity.ok(doctors);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getDoctorsByDepartment: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // API MỚI: Lấy danh sách khung giờ khả dụng theo bác sĩ và ngày
    @GetMapping("/doctors/{doctorId}/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(@PathVariable Long doctorId, 
                                                         @RequestParam String appointmentDate) {
        System.out.println("=== 🕒 ADMIN GET AVAILABLE SLOTS ===");
        System.out.println("🔍 Doctor ID: " + doctorId + ", Date: " + appointmentDate);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName() + " | Getting available slots");
            
            LocalDate date = LocalDate.parse(appointmentDate);
            List<String> availableSlots = new ArrayList<>();
            
            // Kiểm tra từng khung giờ
            for (String timeSlot : TIME_SLOTS) {
                boolean slotAvailable = checkAvailableSlots(doctorId, date, timeSlot);
                if (slotAvailable) {
                    availableSlots.add(timeSlot);
                }
            }
            
            System.out.println("✅ Found " + availableSlots.size() + " available slots for doctor " + doctorId);
            
            return ResponseEntity.ok(availableSlots);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAvailableSlots: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // API MỚI: Duyệt đơn với phân công bác sĩ và khung giờ
    @PostMapping("/registrations/{id}/approve-with-assignment")
    public ResponseEntity<?> approveWithAssignment(@PathVariable Long id,
                                                 @RequestParam Long doctorId,
                                                 @RequestParam String timeSlot) {
        System.out.println("=== ✅ APPROVE WITH ASSIGNMENT ===");
        System.out.println("🔍 Registration ID: " + id + ", Doctor ID: " + doctorId + ", Time Slot: " + timeSlot);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName());
            
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Kiểm tra bác sĩ có tồn tại không
            Optional<Doctor> doctorOpt = doctorService.getDoctorById(doctorId);
            if (doctorOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Bác sĩ không tồn tại");
            }

            PatientRegistration registration = registrationOpt.get();
            Doctor doctor = doctorOpt.get();
            
            // Kiểm tra xem bác sĩ có cùng khoa không
            if (!registration.getDepartment().equals(doctor.getDepartmentName())) {
                return ResponseEntity.badRequest().body("Bác sĩ không thuộc khoa " + registration.getDepartment());
            }

            // Kiểm tra khung giờ có khả dụng không
            boolean slotAvailable = checkAvailableSlots(doctorId, registration.getAppointmentDate(), timeSlot);
            if (!slotAvailable) {
                return ResponseEntity.badRequest().body("Khung giờ " + timeSlot + " đã hết slot");
            }

            // QUAN TRỌNG: Phân công VÀ duyệt luôn
            registration.setDoctorId(doctorId);
            registration.setAssignedSession(timeSlot);
            
            // Gọi service để duyệt (set status APPROVED và queue number)
            PatientRegistration approved = registrationService.tryApproveRegistration(registration.getId());
            
            System.out.println("✅ Successfully approved with assignment:");
            System.out.println("   - Doctor: " + doctor.getFullName());
            System.out.println("   - Time Slot: " + timeSlot);
            System.out.println("   - Queue: " + approved.getQueueNumber());
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.err.println("❌ Error in approveWithAssignment: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi khi duyệt đơn: " + e.getMessage());
        }
    }

    // API MỚI: Duyệt nhanh với random bác sĩ và khung giờ
    @PostMapping("/registrations/{id}/quick-approve")
    public ResponseEntity<?> quickApprove(@PathVariable Long id) {
        System.out.println("=== ⚡ QUICK APPROVE ===");
        System.out.println("🔍 Registration ID: " + id);
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("👤 Admin: " + auth.getName());
            
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            PatientRegistration registration = registrationOpt.get();
            
            // Lấy danh sách bác sĩ theo khoa
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentName(registration.getDepartment());
            
            if (doctors.isEmpty()) {
                return ResponseEntity.badRequest().body("Không có bác sĩ nào trong khoa " + registration.getDepartment());
            }

            // Tìm bác sĩ và khung giờ có slot trống
            Doctor selectedDoctor = null;
            String selectedTimeSlot = null;
            
            for (Doctor doctor : doctors) {
                for (String timeSlot : TIME_SLOTS) {
                    boolean slotAvailable = checkAvailableSlots(
                        doctor.getId(),
                        registration.getAppointmentDate(),
                        timeSlot
                    );
                    
                    if (slotAvailable) {
                        selectedDoctor = doctor;
                        selectedTimeSlot = timeSlot;
                        break;
                    }
                }
                if (selectedDoctor != null) break;
            }

            if (selectedDoctor == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy bác sĩ và khung giờ nào còn slot trống");
            }

            // Phân công VÀ duyệt luôn
            registration.setDoctorId(selectedDoctor.getId());
            registration.setAssignedSession(selectedTimeSlot);
            
            // Gọi service để duyệt
            PatientRegistration approved = registrationService.tryApproveRegistration(registration.getId());
            
            System.out.println("✅ Successfully quick approved:");
            System.out.println("   - Random Doctor: " + selectedDoctor.getFullName());
            System.out.println("   - Random Time Slot: " + selectedTimeSlot);
            System.out.println("   - Queue: " + approved.getQueueNumber());
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.err.println("❌ Error in quickApprove: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi khi duyệt đơn nhanh: " + e.getMessage());
        }
    }

    // Method kiểm tra slot khả dụng - SỬ DỤNG SERVICE THAY VÌ TỰ IMPLEMENT
    private boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("🔍 AdminController - Checking available slots:");
            System.out.println("   - Doctor ID: " + doctorId);
            System.out.println("   - Date: " + appointmentDate);
            System.out.println("   - Session: " + timeSlot);
            
            // SỬ DỤNG SERVICE để kiểm tra slot
            boolean available = registrationService.checkAvailableSlots(doctorId, appointmentDate, timeSlot);
            
            System.out.println("✅ Slot available: " + available);
            return available;
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi kiểm tra slot: " + e.getMessage());
            e.printStackTrace();
            return false;
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

    // DEBUG ENDPOINT MỚI: Kiểm tra slot chi tiết
    @GetMapping("/debug/slots/{doctorId}")
    public ResponseEntity<Map<String, Object>> debugSlots(@PathVariable Long doctorId, 
                                                         @RequestParam String appointmentDate,
                                                         @RequestParam String timeSlot) {
        try {
            LocalDate date = LocalDate.parse(appointmentDate);
            
            Map<String, Object> result = new HashMap<>();
            result.put("doctorId", doctorId);
            result.put("appointmentDate", appointmentDate);
            result.put("timeSlot", timeSlot);
            
            // Đếm số lượng đơn APPROVED
            Integer approvedCount = registrationService.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, date, timeSlot, "APPROVED"
            );
            result.put("approvedCount", approvedCount);
            result.put("maxPatientsPerSlot", MAX_PATIENTS_PER_SLOT);
            result.put("available", approvedCount < MAX_PATIENTS_PER_SLOT);
            
            // Lấy danh sách các đơn APPROVED để debug
            List<PatientRegistration> approvedRegistrations = patientRegistrationRepository.findByDoctorAndDateAndSession(
                doctorId, date, timeSlot
            );
            result.put("approvedRegistrations", approvedRegistrations.stream()
                .map(r -> Map.of(
                    "id", r.getId(),
                    "fullName", r.getFullName(),
                    "status", r.getStatus(),
                    "queueNumber", r.getQueueNumber()
                ))
                .collect(Collectors.toList()));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}