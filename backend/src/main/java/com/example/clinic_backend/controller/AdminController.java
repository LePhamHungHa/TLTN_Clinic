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
    
    // API lấy tất cả đơn đăng ký
    @GetMapping("/registrations")
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        System.out.println("Admin: lay danh sach don dang ky");
        
        try {
            // lay thong tin nguoi dang nhap
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Admin dang nhap: " + auth.getName());
            
            // goi service de lay du lieu
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            
            // in ra so luong de debug
            System.out.println("So luong don: " + registrations.size());
            
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.out.println("Loi: " + e);
            return ResponseEntity.status(500).build();
        }
    }
    
    // API lay thong ke
    @GetMapping("/registrations/stats")
    public ResponseEntity<Map<String, Object>> getRegistrationStats() {
        System.out.println("Lay thong ke don dang ky");
        
        try {
            List<PatientRegistration> all = registrationService.getAll();
            
            Map<String, Object> stats = new HashMap<>();
            
            // dem tung loai trang thai
            long total = all.size();
            long approved = all.stream().filter(r -> "APPROVED".equals(r.getStatus())).count();
            long pending = all.stream().filter(r -> "PENDING".equals(r.getStatus())).count();
            long review = all.stream().filter(r -> "NEEDS_MANUAL_REVIEW".equals(r.getStatus())).count();
            long rejected = all.stream().filter(r -> "REJECTED".equals(r.getStatus())).count();
            
            stats.put("TOTAL", total);
            stats.put("APPROVED", approved);
            stats.put("PENDING", pending);
            stats.put("NEEDS_MANUAL_REVIEW", review);
            stats.put("REJECTED", rejected);
            
            System.out.println("Thong ke: " + stats);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.out.println("Loi thong ke: " + e);
            return ResponseEntity.status(500).build();
        }
    }
    
    // API tu choi don
    @PostMapping("/registrations/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody String reason) {
        System.out.println("Tu choi don id=" + id + ", ly do: " + reason);
        
        try {
            PatientRegistration rejected = registrationService.rejectRegistration(id, reason);
            return ResponseEntity.ok(rejected);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // API danh dau can xu ly thu cong
    @PutMapping("/registrations/{id}/manual-review")
    public ResponseEntity<?> markForManualReview(@PathVariable Long id) {
        System.out.println("Danh dau can xu ly thu cong id=" + id);
        
        try {
            PatientRegistration registration = registrationService.getById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don"));
            
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            PatientRegistration updated = registrationService.update(registration);
            
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // API lay trang thai thanh toan
    @GetMapping("/registrations/{registrationId}/payment-status")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable Long registrationId) {
        System.out.println("Lay trang thai thanh toan cho don: " + registrationId);
        
        try {
            // tim payment
            Optional<Payment> paymentOpt = paymentRepository.findByPatientRegistrationId(registrationId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                result.put("paymentStatus", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("paymentDate", payment.getUpdatedAt());
            } else {
                result.put("paymentStatus", "Chua thanh toan");
                result.put("amount", null);
                result.put("paymentDate", null);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.out.println("Loi lay thanh toan: " + e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("paymentStatus", "Chua thanh toan");
            return ResponseEntity.ok(errorResult);
        }
    }
    
    // API lay bac si theo khoa
    @GetMapping("/doctors/by-department")
    public ResponseEntity<List<Doctor>> getDoctorsByDepartment(@RequestParam String department) {
        System.out.println("Lay bac si khoa: " + department);
        
        try {
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentName(department);
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            System.out.println("Loi lay bac si: " + e);
            return ResponseEntity.status(500).build();
        }
    }
    
    // API lay khung gio kha dung
    @GetMapping("/doctors/{doctorId}/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(@PathVariable Long doctorId, 
                                                         @RequestParam String appointmentDate) {
        System.out.println("Lay khung gio bac si " + doctorId + ", ngay: " + appointmentDate);
        
        try {
            LocalDate date = LocalDate.parse(appointmentDate);
            List<String> availableSlots = new ArrayList<>();
            
            // cac khung gio co dinh
            String[] timeSlots = {
                "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
                "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
            };
            
            // kiem tra tung khung gio
            for (String timeSlot : timeSlots) {
                boolean slotAvailable = checkAvailableSlots(doctorId, date, timeSlot);
                if (slotAvailable) {
                    availableSlots.add(timeSlot);
                }
            }
            
            return ResponseEntity.ok(availableSlots);
            
        } catch (Exception e) {
            System.out.println("Loi lay khung gio: " + e);
            return ResponseEntity.status(500).build();
        }
    }
    
    // API duyet don voi phan cong
    @PostMapping("/registrations/{id}/approve-with-assignment")
    public ResponseEntity<?> approveWithAssignment(@PathVariable Long id,
                                                 @RequestParam Long doctorId,
                                                 @RequestParam String timeSlot) {
        System.out.println("Duyet don " + id + ", bac si " + doctorId + ", gio " + timeSlot);
        
        try {
            // kiem tra don ton tai
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (!registrationOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // kiem tra bac si ton tai
            Optional<Doctor> doctorOpt = doctorService.getDoctorById(doctorId);
            if (!doctorOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Bac si khong ton tai");
            }
            
            PatientRegistration registration = registrationOpt.get();
            Doctor doctor = doctorOpt.get();
            
            // kiem tra cung khoa
            if (!registration.getDepartment().equals(doctor.getDepartmentName())) {
                return ResponseEntity.badRequest().body("Bac si khong thuoc khoa " + registration.getDepartment());
            }
            
            // kiem tra khung gio con trong khong
            boolean slotAvailable = checkAvailableSlots(doctorId, registration.getAppointmentDate(), timeSlot);
            if (!slotAvailable) {
                return ResponseEntity.badRequest().body("Khung gio " + timeSlot + " da het cho");
            }
            
            // phan cong va duyet
            registration.setDoctorId(doctorId);
            registration.setAssignedSession(timeSlot);
            
            PatientRegistration approved = registrationService.tryApproveRegistration(registration.getId());
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.out.println("Loi duyet don: " + e);
            return ResponseEntity.status(500).body("Loi khi duyet don: " + e.getMessage());
        }
    }
    
    // API duyet nhanh
    @PostMapping("/registrations/{id}/quick-approve")
    public ResponseEntity<?> quickApprove(@PathVariable Long id) {
        System.out.println("Duyet nhanh don " + id);
        
        try {
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (!registrationOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            PatientRegistration registration = registrationOpt.get();
            
            // lay bac si theo khoa
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentName(registration.getDepartment());
            
            if (doctors.isEmpty()) {
                return ResponseEntity.badRequest().body("Khong co bac si nao trong khoa " + registration.getDepartment());
            }
            
            // khung gio co dinh
            String[] timeSlots = {
                "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
                "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
            };
            
            // tim slot trong
            Doctor selectedDoctor = null;
            String selectedTimeSlot = null;
            
            for (Doctor doctor : doctors) {
                for (String timeSlot : timeSlots) {
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
                return ResponseEntity.badRequest().body("Khong tim thay khung gio nao con trong");
            }
            
            // phan cong va duyet
            registration.setDoctorId(selectedDoctor.getId());
            registration.setAssignedSession(selectedTimeSlot);
            
            PatientRegistration approved = registrationService.tryApproveRegistration(registration.getId());
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.out.println("Loi duyet nhanh: " + e);
            return ResponseEntity.status(500).body("Loi khi duyet nhanh: " + e.getMessage());
        }
    }
    
    // kiem tra slot con trong khong
    private boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            // goi service de kiem tra
            boolean available = registrationService.checkAvailableSlots(doctorId, appointmentDate, timeSlot);
            return available;
        } catch (Exception e) {
            System.out.println("Loi kiem tra slot: " + e);
            return false;
        }
    }
    
    // debug endpoint
    @GetMapping("/debug/test")
    public ResponseEntity<Map<String, String>> debugTest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin api dang hoat dong");
        response.put("user", auth.getName());
        response.put("authenticated", String.valueOf(auth.isAuthenticated()));
        return ResponseEntity.ok(response);
    }
    
    // debug slot chi tiet
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
            
            // dem so don da duyet
            Integer approvedCount = registrationService.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, date, timeSlot, "APPROVED"
            );
            result.put("approvedCount", approvedCount);
            result.put("maxPatientsPerSlot", 10);
            result.put("available", approvedCount < 10);
            
            // lay danh sach don de debug
            List<PatientRegistration> approvedRegistrations = patientRegistrationRepository.findByDoctorAndDateAndSession(
                doctorId, date, timeSlot
            );
            result.put("approvedRegistrations", approvedRegistrations.stream()
                .map(r -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", r.getId());
                    info.put("fullName", r.getFullName());
                    info.put("status", r.getStatus());
                    info.put("queueNumber", r.getQueueNumber());
                    return info;
                })
                .collect(Collectors.toList()));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}