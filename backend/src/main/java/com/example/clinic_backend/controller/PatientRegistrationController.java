package com.example.clinic_backend.controller;

import com.example.clinic_backend.dto.ErrorResponseDTO;
import com.example.clinic_backend.dto.PatientRegistrationDTO;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.service.PatientRegistrationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient-registrations")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientRegistrationController {

    private static final Logger log = LoggerFactory.getLogger(PatientRegistrationController.class);
    
    private final PatientRegistrationRepository registrationRepository;
    private final PatientRegistrationService registrationService;

    public PatientRegistrationController(PatientRegistrationRepository registrationRepository, 
                                       PatientRegistrationService registrationService) {
        this.registrationRepository = registrationRepository;
        this.registrationService = registrationService;
    }

    // ENDPOINT - Lấy lịch hẹn theo email
    @GetMapping("/by-email")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByEmail(@RequestParam String email) {
        try {
            log.info("Đang lấy lịch hẹn cho email: {}", email);
            
            List<PatientRegistration> registrations = registrationService.getByEmail(email);
            
            // DEBUG: Kiểm tra thông tin bác sĩ
            log.debug("DEBUG - Kiểm tra thông tin bác sĩ:");
            registrations.forEach(reg -> {
                if (reg.getDoctor() != null) {
                    log.debug("Registration ID: {} - Bác sĩ: {} - Học vị: {} - Chức vụ: {}", 
                            reg.getId(), reg.getDoctor().getFullName(), 
                            reg.getDoctor().getDegree(), reg.getDoctor().getPosition());
                } else {
                    log.debug("Registration ID: {} - Bác sĩ: NULL - Doctor ID: {}", 
                            reg.getId(), reg.getDoctorId());
                }
            });
            
            log.info("Đã tìm thấy {} lịch hẹn cho email: {}", registrations.size(), email);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn theo email: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // POST method - Tạo đăng ký mới VỚI TÍCH HỢP SLOT VÀ THÔNG BÁO
    @PostMapping
    public ResponseEntity<?> createRegistration(@Valid @RequestBody PatientRegistrationDTO dto) {
        try {
            log.info("=== NHẬN YÊU CẦU ĐĂNG KÝ ===");
            log.info("DTO: {}", dto);
            log.info("================================");

            // Validation cơ bản
            if (dto.getFullName() == null || dto.getFullName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Họ và tên là bắt buộc");
            }
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email là bắt buộc");
            }
            if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Số điện thoại là bắt buộc");
            }
            
            // QUAN TRỌNG: Nếu có doctorId thì phải có timeSlot
            if (dto.getDoctorId() != null && (dto.getTimeSlot() == null || dto.getTimeSlot().trim().isEmpty())) {
                return ResponseEntity.badRequest().body("Nếu chọn bác sĩ thì phải chọn khung giờ");
            }

            PatientRegistration registration = new PatientRegistration();
            registration.setFullName(dto.getFullName().trim());

            // Xử lý ngày sinh
            if (dto.getDob() != null && !dto.getDob().isEmpty()) {
                try {
                    registration.setDob(LocalDate.parse(dto.getDob()));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Định dạng ngày sinh không hợp lệ. Sử dụng YYYY-MM-DD");
                }
            } else {
                return ResponseEntity.badRequest().body("Ngày sinh là bắt buộc");
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
                    return ResponseEntity.badRequest().body("Định dạng ngày hẹn không hợp lệ. Sử dụng YYYY-MM-DD");
                }
            } else {
                return ResponseEntity.badRequest().body("Ngày hẹn là bắt buộc");
            }

            // QUAN TRỌNG: doctorId có thể là null nếu người dùng không chọn bác sĩ
            registration.setDoctorId(dto.getDoctorId());

            // Xử lý time slot - có thể là null nếu không chọn bác sĩ
            registration.setAssignedSession(dto.getTimeSlot());

            // Set thời gian tạo và status
            registration.setCreatedAt(LocalDateTime.now());
            registration.setStatus("PROCESSING");

            log.info("Đang gọi service xử lý đăng ký...");
            log.info("Thông tin đăng ký:");
            log.info("   - Doctor ID: {}", registration.getDoctorId());
            log.info("   - Appointment Date: {}", registration.getAppointmentDate());
            log.info("   - Time Slot: {}", registration.getAssignedSession());
            
            // GỌI SERVICE XỬ LÝ ĐĂNG KÝ
            PatientRegistration savedRegistration = registrationService.createRegistration(registration);
            
            // ĐẢM BẢO LUÔN CÓ REGISTRATION NUMBER
            if (savedRegistration.getRegistrationNumber() == null || 
                savedRegistration.getRegistrationNumber().isEmpty()) {
                savedRegistration.setRegistrationNumber(generateRegistrationNumber());
                savedRegistration = registrationService.save(savedRegistration);
            }
            
            log.info("Đăng ký đã được xử lý thành công với trạng thái: {}", savedRegistration.getStatus());
            log.info("Chi tiết đăng ký:");
            log.info("   - ID: {}", savedRegistration.getId());
            log.info("   - Status: {}", savedRegistration.getStatus());
            log.info("   - Registration Number: {}", savedRegistration.getRegistrationNumber());
            log.info("   - Assigned Session: {}", savedRegistration.getAssignedSession());
            log.info("   - Queue Number: {}", savedRegistration.getQueueNumber());
            
            return ResponseEntity.ok(savedRegistration);

        } catch (Exception e) {
            log.error("LỖI trong createRegistration: {}", e.getMessage(), e);
            ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Lỗi Server",
                "Lỗi khi tạo đăng ký: " + e.getMessage(),
                "/api/patient-registrations"
            );
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    // Lấy tất cả đăng ký (cho admin)
    @GetMapping
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        try {
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            log.info("Đã lấy {} đăng ký với thông tin bác sĩ", registrations.size());
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            log.error("Lỗi khi lấy tất cả đăng ký: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy đăng ký theo ID
    @GetMapping("/{id}")
    public ResponseEntity<PatientRegistration> getRegistrationById(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registration = registrationService.getById(id);
            if (registration.isPresent()) {
                log.info("Đã tìm thấy đăng ký với ID: {}", id);
                return ResponseEntity.ok(registration.get());
            } else {
                log.warn("Không tìm thấy đăng ký với ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Lỗi khi lấy đăng ký theo ID: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Cập nhật đăng ký
    @PutMapping("/{id}")
    public ResponseEntity<PatientRegistration> updateRegistration(@PathVariable Long id, 
                                                                 @Valid @RequestBody PatientRegistrationDTO dto) {
        try {
            Optional<PatientRegistration> existingOpt = registrationService.getById(id);
            if (existingOpt.isEmpty()) {
                log.warn("Không tìm thấy đăng ký để cập nhật với ID: {}", id);
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
            
            // QUAN TRỌNG: Nếu có doctorId thì phải có timeSlot
            if (dto.getDoctorId() != null && (dto.getTimeSlot() == null || dto.getTimeSlot().trim().isEmpty())) {
                log.error("Lỗi validation: Đã chọn bác sĩ nhưng không có khung giờ");
                return ResponseEntity.badRequest().body(null);
            }
            
            existing.setDoctorId(dto.getDoctorId());
            if (dto.getTimeSlot() != null) {
                existing.setAssignedSession(dto.getTimeSlot());
            }

            PatientRegistration updated = registrationService.update(existing);
            log.info("Đã cập nhật đăng ký với ID: {}", id);
            
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            log.error("Lỗi khi cập nhật đăng ký: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Xóa đăng ký
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegistration(@PathVariable Long id) {
        try {
            if (!registrationService.existsById(id)) {
                log.warn("Không tìm thấy đăng ký để xóa với ID: {}", id);
                return ResponseEntity.notFound().build();
            }
            registrationService.deleteById(id);
            log.info("Đã xóa đăng ký với ID: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Lỗi khi xóa đăng ký: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy các đăng ký cần xử lý thủ công (cho admin)
    @GetMapping("/manual-review")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsNeedingManualReview() {
        try {
            List<PatientRegistration> registrations = registrationService.getRegistrationsNeedingManualReview();
            log.info("Đã tìm thấy {} đăng ký cần xử lý thủ công", registrations.size());
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            log.error("Lỗi khi lấy đăng ký cần xử lý thủ công: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Thử duyệt đơn thủ công (cho admin)
    @PostMapping("/{id}/try-approve")
    public ResponseEntity<?> tryApproveRegistration(@PathVariable Long id) {
        try {
            log.info("Đang thử duyệt đơn thủ công với ID: {}", id);
            
            PatientRegistration approvedRegistration = registrationService.tryApproveRegistration(id);
            
            log.info("Đã duyệt thành công đăng ký với ID: {}", id);
            log.info("Chi tiết duyệt đơn:");
            log.info("   - Trạng thái mới: {}", approvedRegistration.getStatus());
            log.info("   - Số thứ tự: {}", approvedRegistration.getQueueNumber());
            log.info("   - Số phòng: {}", approvedRegistration.getRoomNumber());
            
            return ResponseEntity.ok(approvedRegistration);
            
        } catch (Exception e) {
            log.error("Lỗi khi thử duyệt đăng ký: {}", e.getMessage(), e);
            ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.BAD_REQUEST.value(),
                "Yêu cầu không hợp lệ",
                "Không thể duyệt đơn: " + e.getMessage(),
                "/api/patient-registrations/" + id + "/try-approve"
            );
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Từ chối đơn (cho admin)
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody(required = false) String reason) {
        try {
            log.info("Đang từ chối đăng ký với ID: {}", id);
            log.info("Lý do: {}", (reason != null ? reason : "Không có lý do"));
            
            PatientRegistration rejectedRegistration = registrationService.rejectRegistration(id, reason);
            
            log.info("Đã từ chối thành công đăng ký với ID: {}", id);
            return ResponseEntity.ok(rejectedRegistration);
            
        } catch (Exception e) {
            log.error("Lỗi khi từ chối đăng ký: {}", e.getMessage(), e);
            ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.BAD_REQUEST.value(),
                "Yêu cầu không hợp lệ",
                "Không thể từ chối đơn: " + e.getMessage(),
                "/api/patient-registrations/" + id + "/reject"
            );
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Lấy đăng ký theo số điện thoại
    @GetMapping("/by-phone")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByPhone(@RequestParam String phone) {
        try {
            log.info("Đang lấy lịch hẹn cho số điện thoại: {}", phone);
            
            List<PatientRegistration> registrations = registrationService.getByPhone(phone);
            
            log.info("Đã tìm thấy {} lịch hẹn cho số điện thoại: {}", registrations.size(), phone);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn theo số điện thoại: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy đăng ký theo trạng thái
    @GetMapping("/by-status")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByStatus(@RequestParam String status) {
        try {
            log.info("Đang lấy lịch hẹn với trạng thái: {}", status);
            
            List<PatientRegistration> registrations = registrationService.getByStatus(status);
            
            log.info("Đã tìm thấy {} lịch hẹn với trạng thái: {}", registrations.size(), status);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            log.error("Lỗi khi lấy lịch hẹn theo trạng thái: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // API XỬ LÝ THANH TOÁN THÀNH CÔNG
    @PostMapping("/{id}/payment-success")
    public ResponseEntity<?> processPaymentSuccess(@PathVariable Long id, 
                                                  @RequestBody PaymentRequest paymentRequest) {
        try {
            log.info("Nhận yêu cầu xử lý thanh toán thành công");
            log.info("   - Registration ID: {}", id);
            log.info("   - Transaction: {}", paymentRequest.getTransactionNumber());
            log.info("   - Amount: {}", paymentRequest.getAmount());

            PatientRegistration updatedRegistration = registrationService.processPaymentSuccess(
                id, 
                paymentRequest.getTransactionNumber(), 
                paymentRequest.getAmount()
            );

            log.info("Đã xử lý thanh toán thành công và gửi email xác nhận");
            return ResponseEntity.ok(updatedRegistration);

        } catch (Exception e) {
            log.error("Lỗi xử lý thanh toán: {}", e.getMessage(), e);
            ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.BAD_REQUEST.value(),
                "Yêu cầu không hợp lệ",
                "Lỗi xử lý thanh toán: " + e.getMessage(),
                "/api/patient-registrations/" + id + "/payment-success"
            );
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // API GỬI EMAIL NHẮC LỊCH THỦ CÔNG (CHO TESTING)
    @PostMapping("/{id}/send-reminder")
    public ResponseEntity<?> sendManualReminder(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                log.warn("Không tìm thấy đăng ký để gửi nhắc lịch với ID: {}", id);
                return ResponseEntity.notFound().build();
            }

            PatientRegistration registration = registrationOpt.get();
            log.info("Đang gửi email nhắc lịch thủ công cho registration ID: {}", id);
            
            // TODO: Gọi email service để gửi reminder
            
            return ResponseEntity.ok().body("Đã gửi email nhắc lịch");

        } catch (Exception e) {
            log.error("Lỗi gửi email nhắc lịch: {}", e.getMessage(), e);
            ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                HttpStatus.BAD_REQUEST.value(),
                "Yêu cầu không hợp lệ",
                "Lỗi gửi email: " + e.getMessage(),
                "/api/patient-registrations/" + id + "/send-reminder"
            );
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Helper method để tạo registration number
    private String generateRegistrationNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int)(Math.random() * 1000));
        return "REG-" + timestamp.substring(timestamp.length() - 8) + "-" + random;
    }

    // Inner class cho Payment Request
    public static class PaymentRequest {
        private String transactionNumber;
        private Double amount;

        // Getters and Setters
        public String getTransactionNumber() { return transactionNumber; }
        public void setTransactionNumber(String transactionNumber) { this.transactionNumber = transactionNumber; }
        
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
    }

    // Global Exception Handler cho Controller này
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationExceptions(MethodArgumentNotValidException ex) {
        BindingResult result = ex.getBindingResult();
        String errorMessage = result.getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
            HttpStatus.BAD_REQUEST.value(),
            "Lỗi Validation",
            errorMessage,
            "/api/patient-registrations"
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGeneralException(Exception ex) {
        log.error("Ngoại lệ chưa được xử lý: {}", ex.getMessage(), ex);
        
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Lỗi Server",
            "Đã xảy ra lỗi không mong muốn",
            "/api/patient-registrations"
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}