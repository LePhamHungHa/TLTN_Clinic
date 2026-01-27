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
    
    // Khai báo hằng số
    private static final String[] TIME_SLOTS = {
        "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
        "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    };
    
    private static final int MAX_PATIENTS_PER_SLOT = 10;
    
    
    //  API lấy tất cả đơn đăng ký với thông tin bác sĩ đầy đủ

    @GetMapping("/registrations")
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        try {
            // Xác thực và ghi log thông tin người dùng
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Admin: " + auth.getName() + " đang lấy danh sách đăng ký");
            
            // Gọi service để lấy dữ liệu
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            
            // Kiểm tra và ghi log dữ liệu mẫu để debug
            if (!registrations.isEmpty()) {
                PatientRegistration sample = registrations.get(0);
                System.out.println("Mẫu dữ liệu: ID=" + sample.getId() + 
                                 ", Tên=" + sample.getFullName() + 
                                 ", Bác sĩ=" + (sample.getDoctor() != null ? sample.getDoctor().getFullName() : "Chưa phân công"));
            }
            
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            // Xử lý lỗi và ghi log chi tiết
            System.err.println("Lỗi khi lấy danh sách đăng ký: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    
    // API lấy thống kê về trạng thái các đơn đăng ký

    @GetMapping("/registrations/stats")
    public ResponseEntity<Map<String, Object>> getRegistrationStats() {
        try {
            // Lấy danh sách tất cả đơn đăng ký
            List<PatientRegistration> allRegistrations = registrationService.getAll();
            
            // Khởi tạo map chứa thống kê
            Map<String, Object> stats = new HashMap<>();
            
            // Tính toán các thống kê
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
            
            System.out.println("Thống kê đơn đăng ký: " + stats);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy thống kê: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    
    //  API từ chối đơn đăng ký

    @PostMapping("/registrations/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody String reason) {
        try {
            System.out.println("Từ chối đơn ID: " + id + ", Lý do: " + reason);
            
            // Gọi service để xử lý từ chối
            PatientRegistration rejected = registrationService.rejectRegistration(id, reason);
            
            System.out.println("Đã từ chối thành công: ID=" + rejected.getId() + 
                             ", Trạng thái mới=" + rejected.getStatus());
            
            return ResponseEntity.ok(rejected);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi từ chối đơn: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // API lấy trạng thái thanh toán của đơn đăng ký

    @GetMapping("/registrations/{registrationId}/payment-status")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable Long registrationId) {
        try {
            System.out.println("Lấy trạng thái thanh toán cho đơn: " + registrationId);
            
            // Tìm payment dựa trên registrationId
            Optional<Payment> paymentOpt = paymentRepository.findByPatientRegistrationId(registrationId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (paymentOpt.isPresent()) {
                // Nếu có payment, trả về thông tin chi tiết
                Payment payment = paymentOpt.get();
                result.put("paymentStatus", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("paymentDate", payment.getUpdatedAt());
                
                System.out.println("Tìm thấy payment: " + payment.getStatus());
            } else {
                // Nếu không có payment, trả về trạng thái mặc định
                result.put("paymentStatus", "Chưa thanh toán");
                result.put("amount", null);
                result.put("paymentDate", null);
                
                System.out.println("Không tìm thấy payment");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy trạng thái thanh toán: " + e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("paymentStatus", "Chưa thanh toán");
            return ResponseEntity.ok(errorResult);
        }
    }
    
    
    // API lấy danh sách bác sĩ theo khoa

    @GetMapping("/doctors/by-department")
    public ResponseEntity<List<Doctor>> getDoctorsByDepartment(@RequestParam String department) {
        try {
            System.out.println("Lấy danh sách bác sĩ khoa: " + department);
            
            // Gọi service để lấy danh sách bác sĩ
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentName(department);
            
            System.out.println("Tìm thấy " + doctors.size() + " bác sĩ");
            
            return ResponseEntity.ok(doctors);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy danh sách bác sĩ: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    
    //  API lấy khung giờ khả dụng của bác sĩ

    @GetMapping("/doctors/{doctorId}/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(@PathVariable Long doctorId, 
                                                         @RequestParam String appointmentDate) {
        try {
            System.out.println("Lấy khung giờ khả dụng - Bác sĩ: " + doctorId + ", Ngày: " + appointmentDate);
            
            LocalDate date = LocalDate.parse(appointmentDate);
            List<String> availableSlots = new ArrayList<>();
            
            // Kiểm tra từng khung giờ trong TIME_SLOTS
            for (String timeSlot : TIME_SLOTS) {
                boolean slotAvailable = checkAvailableSlots(doctorId, date, timeSlot);
                if (slotAvailable) {
                    availableSlots.add(timeSlot);
                }
            }
            
            System.out.println("Có " + availableSlots.size() + " khung giờ khả dụng");
            
            return ResponseEntity.ok(availableSlots);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy khung giờ: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
  
    //  API duyệt đơn với phân công bác sĩ và khung giờ cụ thể

    @PostMapping("/registrations/{id}/approve-with-assignment")
    public ResponseEntity<?> approveWithAssignment(@PathVariable Long id,
                                                 @RequestParam Long doctorId,
                                                 @RequestParam String timeSlot) {
        try {
            System.out.println("Duyệt đơn có phân công - Đơn: " + id + ", Bác sĩ: " + doctorId + ", Giờ: " + timeSlot);
            
            // Kiểm tra đơn đăng ký tồn tại
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Kiểm tra bác sĩ tồn tại
            Optional<Doctor> doctorOpt = doctorService.getDoctorById(doctorId);
            if (doctorOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Bác sĩ không tồn tại");
            }
            
            PatientRegistration registration = registrationOpt.get();
            Doctor doctor = doctorOpt.get();
            
            // Kiểm tra bác sĩ có cùng khoa với đơn đăng ký
            if (!registration.getDepartment().equals(doctor.getDepartmentName())) {
                return ResponseEntity.badRequest()
                    .body("Bác sĩ không thuộc khoa " + registration.getDepartment());
            }
            
            // Kiểm tra khung giờ còn trống
            boolean slotAvailable = checkAvailableSlots(doctorId, registration.getAppointmentDate(), timeSlot);
            if (!slotAvailable) {
                return ResponseEntity.badRequest().body("Khung giờ " + timeSlot + " đã hết chỗ");
            }
            
            // Cập nhật thông tin phân công
            registration.setDoctorId(doctorId);
            registration.setAssignedSession(timeSlot);
            
            // Duyệt đơn
            PatientRegistration approved = registrationService.tryApproveRegistration(registration.getId());
            
            System.out.println("Duyệt thành công: Bác sĩ=" + doctor.getFullName() + 
                             ", Giờ=" + timeSlot + ", STT=" + approved.getQueueNumber());
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi duyệt đơn có phân công: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
    
    
    // API duyệt nhanh đơn đăng ký với bác sĩ và khung giờ tự động chọn
     
    @PostMapping("/registrations/{id}/quick-approve")
    public ResponseEntity<?> quickApprove(@PathVariable Long id) {
        try {
            System.out.println("Duyệt nhanh đơn: " + id);
            
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            PatientRegistration registration = registrationOpt.get();
            
            // Lấy danh sách bác sĩ cùng khoa
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentName(registration.getDepartment());
            
            if (doctors.isEmpty()) {
                return ResponseEntity.badRequest().body("Không có bác sĩ trong khoa " + registration.getDepartment());
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
                return ResponseEntity.badRequest().body("Không còn slot trống nào");
            }
            
            // Phân công và duyệt
            registration.setDoctorId(selectedDoctor.getId());
            registration.setAssignedSession(selectedTimeSlot);
            
            PatientRegistration approved = registrationService.tryApproveRegistration(registration.getId());
            
            System.out.println("Duyệt nhanh thành công: Bác sĩ=" + selectedDoctor.getFullName() + 
                             ", Giờ=" + selectedTimeSlot);
            
            return ResponseEntity.ok(approved);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi duyệt nhanh: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
    
    
    //  Phương thức kiểm tra khung giờ còn trống hay không
    
    private boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("Kiểm tra slot: Bác sĩ=" + doctorId + 
                             ", Ngày=" + appointmentDate + ", Giờ=" + timeSlot);
            
            // Sử dụng service để kiểm tra
            boolean available = registrationService.checkAvailableSlots(doctorId, appointmentDate, timeSlot);
            
            System.out.println("Kết quả kiểm tra: " + available);
            return available;
            
        } catch (Exception e) {
            System.err.println("Lỗi kiểm tra slot: " + e.getMessage());
            return false;
        }
    }
    
    
    //   API debug kiểm tra thông tin slot chi tiết
     
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
            
            // Đếm số đơn đã duyệt
            Integer approvedCount = registrationService.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, date, timeSlot, "APPROVED"
            );
            
            result.put("approvedCount", approvedCount);
            result.put("maxPatientsPerSlot", MAX_PATIENTS_PER_SLOT);
            result.put("available", approvedCount < MAX_PATIENTS_PER_SLOT);
            
            // Lấy danh sách đơn để debug
            List<PatientRegistration> approvedRegistrations = 
                patientRegistrationRepository.findByDoctorAndDateAndSession(doctorId, date, timeSlot);
            
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
            System.err.println("Lỗi debug slot: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}