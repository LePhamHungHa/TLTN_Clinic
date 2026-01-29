package com.example.clinic_backend.controller;

import com.example.clinic_backend.dto.PatientRegistrationDTO;
import com.example.clinic_backend.dto.CancelAppointmentDTO;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.service.PatientRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/patient-registrations")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PatientRegistrationController {

    private final PatientRegistrationRepository registrationRepository;
    private final PatientRegistrationService registrationService;

    public PatientRegistrationController(PatientRegistrationRepository registrationRepository, 
                                       PatientRegistrationService registrationService) {
        this.registrationRepository = registrationRepository;
        this.registrationService = registrationService;
    }

    // Lấy lịch hẹn theo email
    @GetMapping("/by-email")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByEmail(@RequestParam String email) {
        try {
            System.out.println("Getting registrations for email: " + email);
            
            List<PatientRegistration> registrations = registrationService.getByEmail(email);
            
            System.out.println("Found " + registrations.size() + " registrations for email: " + email);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("Error getting registrations by email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Tạo lịch hẹn mới
    @PostMapping
    public ResponseEntity<?> createRegistration(@RequestBody PatientRegistrationDTO dto) {
        try {
            System.out.println("=== RECEIVED REGISTRATION REQUEST ===");
            System.out.println("DTO: " + dto.toString());

            // Validation cơ bản
            if (dto.getFullName() == null || dto.getFullName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Full name is required");
            }
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Phone is required");
            }

            PatientRegistration registration = new PatientRegistration();
            registration.setFullName(dto.getFullName().trim());

            // Xử lý ngày sinh
            if (dto.getDob() != null && !dto.getDob().isEmpty()) {
                try {
                    registration.setDob(LocalDate.parse(dto.getDob()));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Invalid date format for DOB. Use YYYY-MM-DD");
                }
            } else {
                return ResponseEntity.badRequest().body("Date of birth is required");
            }

            registration.setGender(dto.getGender());
            registration.setPhone(dto.getPhone().trim());
            registration.setEmail(dto.getEmail().trim());
            registration.setAddress(dto.getAddress());
            registration.setDepartment(dto.getDepartment());
            registration.setSymptoms(dto.getSymptoms());

            // Xử lý ngày hẹn
            if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isEmpty()) {
                try {
                    registration.setAppointmentDate(LocalDate.parse(dto.getAppointmentDate()));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Invalid date format for appointment date. Use YYYY-MM-DD");
                }
            } else {
                return ResponseEntity.badRequest().body("Appointment date is required");
            }

            // doctorId có thể là null nếu người dùng không chọn bác sĩ
            registration.setDoctorId(dto.getDoctorId());

            // Xử lý time slot
            registration.setAssignedSession(dto.getTimeSlot());

            // Set thời gian tạo và status
            registration.setCreatedAt(LocalDateTime.now());
            registration.setStatus("PENDING");

            System.out.println("Gọi service xử lý đăng ký...");
            
            // Gọi service xử lý đăng ký
            PatientRegistration savedRegistration = registrationService.createRegistration(registration);
            
            System.out.println("Registration processed successfully with status: " + savedRegistration.getStatus());
            
            return ResponseEntity.ok(savedRegistration);

        } catch (Exception e) {
            System.err.println("ERROR in createRegistration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error creating registration: " + e.getMessage());
        }
    }

    // Lấy tất cả lịch hẹn (cho admin)
    @GetMapping
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        try {
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            System.out.println("Retrieved " + registrations.size() + " registrations with doctor info");
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.err.println("Error getting all registrations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy lịch hẹn theo ID
    @GetMapping("/{id}")
    public ResponseEntity<PatientRegistration> getRegistrationById(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registration = registrationService.getById(id);
            if (registration.isPresent()) {
                System.out.println("Found registration with ID: " + id);
                return ResponseEntity.ok(registration.get());
            } else {
                System.out.println("Registration not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error getting registration by ID: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Cập nhật lịch hẹn
    @PutMapping("/{id}")
    public ResponseEntity<PatientRegistration> updateRegistration(@PathVariable Long id, 
                                                                 @RequestBody PatientRegistrationDTO dto) {
        try {
            Optional<PatientRegistration> existingOpt = registrationService.getById(id);
            if (existingOpt.isEmpty()) {
                System.out.println("Registration not found for update with ID: " + id);
                return ResponseEntity.notFound().build();
            }

            PatientRegistration existing = existingOpt.get();
            
            // Cập nhật các trường cơ bản
            if (dto.getFullName() != null) existing.setFullName(dto.getFullName());
            if (dto.getDob() != null && !dto.getDob().isEmpty()) {
                existing.setDob(LocalDate.parse(dto.getDob()));
            }
            if (dto.getGender() != null) existing.setGender(dto.getGender());
            if (dto.getPhone() != null) existing.setPhone(dto.getPhone());
            if (dto.getEmail() != null) existing.setEmail(dto.getEmail());
            if (dto.getAddress() != null) existing.setAddress(dto.getAddress());
            if (dto.getDepartment() != null) existing.setDepartment(dto.getDepartment());
            if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isEmpty()) {
                existing.setAppointmentDate(LocalDate.parse(dto.getAppointmentDate()));
            }
            if (dto.getSymptoms() != null) existing.setSymptoms(dto.getSymptoms());
            
            // Cập nhật doctor ID và time slot
            existing.setDoctorId(dto.getDoctorId());
            if (dto.getTimeSlot() != null) {
                existing.setAssignedSession(dto.getTimeSlot());
            }

            PatientRegistration updated = registrationService.update(existing);
            System.out.println("Updated registration with ID: " + id);
            
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            System.err.println("Error updating registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Xóa lịch hẹn
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegistration(@PathVariable Long id) {
        try {
            if (!registrationService.existsById(id)) {
                System.out.println("Registration not found for deletion with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            registrationService.deleteById(id);
            System.out.println("Deleted registration with ID: " + id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error deleting registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy lịch hẹn cần xử lý thủ công (cho admin)
    @GetMapping("/manual-review")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsNeedingManualReview() {
        try {
            List<PatientRegistration> registrations = registrationService.getRegistrationsNeedingManualReview();
            System.out.println("Found " + registrations.size() + " registrations needing manual review");
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.err.println("Error getting registrations for manual review: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Duyệt lịch hẹn thủ công (cho admin)
    @PostMapping("/{id}/try-approve")
    public ResponseEntity<?> tryApproveRegistration(@PathVariable Long id) {
        try {
            System.out.println("Attempting to manually approve registration with ID: " + id);
            
            PatientRegistration approvedRegistration = registrationService.tryApproveRegistration(id);
            
            System.out.println("Successfully approved registration with ID: " + id);
            
            return ResponseEntity.ok(approvedRegistration);
            
        } catch (Exception e) {
            System.err.println("Error trying to approve registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Cannot approve registration: " + e.getMessage());
        }
    }

    // Từ chối lịch hẹn (cho admin)
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody(required = false) String reason) {
        try {
            System.out.println("Rejecting registration with ID: " + id);
            
            PatientRegistration rejectedRegistration = registrationService.rejectRegistration(id, reason);
            
            System.out.println("Successfully rejected registration with ID: " + id);
            return ResponseEntity.ok(rejectedRegistration);
            
        } catch (Exception e) {
            System.err.println("Error rejecting registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Cannot reject registration: " + e.getMessage());
        }
    }

    // Lấy lịch hẹn theo số điện thoại
    @GetMapping("/by-phone")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByPhone(@RequestParam String phone) {
        try {
            System.out.println("Getting registrations for phone: " + phone);
            
            List<PatientRegistration> registrations = registrationService.getByPhone(phone);
            
            System.out.println("Found " + registrations.size() + " registrations for phone: " + phone);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("Error getting registrations by phone: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy lịch hẹn theo trạng thái
    @GetMapping("/by-status")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByStatus(@RequestParam String status) {
        try {
            System.out.println("Getting registrations with status: " + status);
            
            List<PatientRegistration> registrations = registrationService.getByStatus(status);
            
            System.out.println("Found " + registrations.size() + " registrations with status: " + status);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("Error getting registrations by status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Xử lý thanh toán thành công
    @PostMapping("/{id}/payment-success")
    public ResponseEntity<?> processPaymentSuccess(@PathVariable Long id, 
                                                  @RequestBody PaymentRequest paymentRequest) {
        try {
            System.out.println("Nhận yêu cầu xử lý thanh toán thành công");
            
            PatientRegistration updatedRegistration = registrationService.processPaymentSuccess(
                id, 
                paymentRequest.getTransactionNumber(), 
                paymentRequest.getAmount()
            );

            System.out.println("Xử lý thanh toán thành công và đã gửi email xác nhận");
            return ResponseEntity.ok(updatedRegistration);

        } catch (Exception e) {
            System.err.println("Lỗi xử lý thanh toán: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi xử lý thanh toán: " + e.getMessage());
        }
    }

    // Gửi email nhắc lịch thủ công (cho testing)
    @PostMapping("/{id}/send-reminder")
    public ResponseEntity<?> sendManualReminder(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            PatientRegistration registration = registrationOpt.get();
            
            // TODO: Gọi email service để gửi reminder
            
            return ResponseEntity.ok().body("Đã gửi email nhắc lịch");

        } catch (Exception e) {
            System.err.println("Lỗi gửi email nhắc lịch: " + e.getMessage());
            return ResponseEntity.badRequest().body("Lỗi gửi email: " + e.getMessage());
        }
    }

    // Kiểm tra điều kiện hủy lịch
    @GetMapping("/{id}/check-cancellation")
    public ResponseEntity<?> checkCancellationEligibility(@PathVariable Long id, 
                                                         @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("Kiểm tra điều kiện hủy lịch cho ID: " + id);
            
            // Lấy userId từ token
            Long userId = extractUserIdFromToken(authHeader);
            
            if (userId == null) {
                return ResponseEntity.status(401).body("Không xác thực được người dùng");
            }
            
            Map<String, Object> result = registrationService.checkCancellationEligibility(id, userId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("Lỗi kiểm tra điều kiện hủy: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi kiểm tra điều kiện hủy: " + e.getMessage());
        }
    }
    
    // FIXED: Hủy lịch hẹn
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelAppointment(@RequestBody CancelAppointmentDTO cancelDTO,
                                              @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            System.out.println("=== NHẬN YÊU CẦU HỦY LỊCH ===");
            System.out.println("Dữ liệu nhận được: " + cancelDTO.toString());
            System.out.println("Auth Header present: " + (authHeader != null));
            
            // Validation cơ bản
            if (cancelDTO.getAppointmentId() == null) {
                System.out.println("Thiếu appointmentId");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Thiếu ID lịch hẹn"
                ));
            }
            
            if (cancelDTO.getReason() == null || cancelDTO.getReason().trim().isEmpty()) {
                System.out.println("Thiếu reason");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Vui lòng nhập lý do hủy"
                ));
            }
            
            // Kiểm tra token cơ bản
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("WARNING: No valid Authorization header");
                // Không reject ngay, cho phép tiếp tục với userId từ DTO
            } else {
                System.out.println("Authorization header OK");
            }
            
            // Xác định userId
            Long userId = cancelDTO.getUserId();
            String userEmail = cancelDTO.getUserEmail();
            
            if (userId == null) {
                System.out.println("UserId from DTO is null, trying to determine...");
                
                // Ưu tiên tìm userId từ email nếu có
                if (userEmail != null && !userEmail.isEmpty()) {
                    System.out.println("Using email to find user: " + userEmail);
                    // TODO: Implement user lookup by email
                    // Tạm thời set userId = 1 cho dev
                    userId = 1L;
                } else {
                    System.out.println("No email provided, using default userId = 1");
                    userId = 1L;
                }
            }
            
            System.out.println("Final userId for cancellation: " + userId);
            
            // Gọi service
            Map<String, Object> result = registrationService.cancelAppointment(cancelDTO, userId);
            
            System.out.println("Service result: " + result);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                System.out.println("Hủy lịch hẹn thành công: " + cancelDTO.getAppointmentId());
                return ResponseEntity.ok(result);
            } else {
                System.out.println("Hủy lịch hẹn thất bại: " + result.get("message"));
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (DataIntegrityViolationException e) {
            System.err.println("Lỗi dữ liệu khi hủy lịch: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Lỗi dữ liệu, vui lòng thử lại",
                "error", e.getMostSpecificCause().getMessage()
            ));
        } catch (Exception e) {
            System.err.println("Lỗi khi hủy lịch hẹn: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi hệ thống khi hủy lịch hẹn: " + e.getMessage(),
                "error", e.toString()
            ));
        }
    }
    
    // Thêm method đơn giản để test token
    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuthentication(@RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("Testing auth header: " + authHeader);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Invalid token format"
                ));
            }
            
            String token = authHeader.substring(7);
            System.out.println("Token length: " + token.length());
            
            // Token hợp lệ (tạm thời chấp nhận mọi token)
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Token is valid",
                "timestamp", LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Authentication test failed"
            ));
        }
    }
    
    // Lấy danh sách lịch hẹn có thể hủy
    @GetMapping("/cancellable")
    public ResponseEntity<?> getCancellableAppointments(@RequestHeader("Authorization") String authHeader) {
        try {
            Long userId = extractUserIdFromToken(authHeader);
            
            if (userId == null) {
                return ResponseEntity.status(401).body("Không xác thực được người dùng");
            }
            
            List<PatientRegistration> appointments = registrationService.getCancellableAppointments(userId);
            return ResponseEntity.ok(appointments);
            
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách lịch có thể hủy: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi lấy danh sách lịch có thể hủy");
        }
    }
    
    
    // Lấy số lượng lịch hẹn theo trạng thái
    @GetMapping("/count-by-status")
    public ResponseEntity<?> getRegistrationCounts() {
        try {
            // Lấy tất cả lịch hẹn
            List<PatientRegistration> allRegistrations = registrationService.getAll();
            
            // Tính toán số lượng theo trạng thái
            int total = allRegistrations.size();
            int approved = 0;
            int pending = 0;
            int cancelled = 0;
            int completed = 0;
            int needsReview = 0;
            
            for (PatientRegistration reg : allRegistrations) {
                String status = reg.getStatus();
                if ("APPROVED".equals(status)) {
                    approved++;
                } else if ("PENDING".equals(status)) {
                    pending++;
                } else if ("CANCELLED".equals(status)) {
                    cancelled++;
                } else if ("COMPLETED".equals(status)) {
                    completed++;
                } else if ("NEEDS_MANUAL_REVIEW".equals(status)) {
                    needsReview++;
                }
            }
            
            // Tạo kết quả
            Map<String, Object> result = Map.of(
                "total", total,
                "approved", approved,
                "pending", pending,
                "cancelled", cancelled,
                "completed", completed,
                "needsReview", needsReview,
                "timestamp", LocalDateTime.now().toString()
            );
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Lỗi lấy thống kê: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi lấy thống kê");
        }
    }
    
    // Lấy danh sách yêu cầu hoàn tiền (cho admin)
    @GetMapping("/refund-requests")
    public ResponseEntity<?> getRefundRequests(@RequestHeader("Authorization") String authHeader) {
        try {
            
            List<PatientRegistration> refundRequests = registrationService.getRefundRequests();
            return ResponseEntity.ok(refundRequests);
            
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách yêu cầu hoàn tiền: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi lấy danh sách yêu cầu hoàn tiền");
        }
    }
    
    // Xử lý yêu cầu hoàn tiền (cho admin)
    @PostMapping("/{id}/process-refund")
    public ResponseEntity<?> processRefund(@PathVariable Long id,
                                          @RequestParam boolean approve,
                                          @RequestBody(required = false) String adminNote,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            
            Map<String, Object> result = registrationService.processRefund(id, approve, adminNote);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            System.err.println("Lỗi xử lý hoàn tiền: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi xử lý hoàn tiền");
        }
    }
    
    // Trích xuất userId từ token (đơn giản hóa)
    private Long extractUserIdFromToken(String authHeader) {
        try {
            // For development only - always return 1
            System.out.println("Extracting userId from token (DEV MODE)");
            return 1L;
        } catch (Exception e) {
            System.err.println("Lỗi extract userId từ token: " + e.getMessage());
            return 1L; // Default for dev
        }
    }
    
    // Inner class cho Payment Request
    public static class PaymentRequest {
        private String transactionNumber;
        private Double amount;

        // Getter và Setter
        public String getTransactionNumber() { return transactionNumber; }
        public void setTransactionNumber(String transactionNumber) { this.transactionNumber = transactionNumber; }
        
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
    }
}