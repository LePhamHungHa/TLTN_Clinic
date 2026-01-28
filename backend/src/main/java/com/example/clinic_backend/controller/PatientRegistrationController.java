package com.example.clinic_backend.controller;

import com.example.clinic_backend.dto.PatientRegistrationDTO;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.service.PatientRegistrationService;
import jakarta.validation.Valid;
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
    
    private final PatientRegistrationRepository registrationRepository;
    private final PatientRegistrationService registrationService;

    public PatientRegistrationController(PatientRegistrationRepository registrationRepository, 
                                       PatientRegistrationService registrationService) {
        this.registrationRepository = registrationRepository;
        this.registrationService = registrationService;
    }

    // lay lich hen theo email
    @GetMapping("/by-email")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByEmail(@RequestParam String email) {
        try {
            System.out.println("Tim lich hen cho email: " + email);
            
            List<PatientRegistration> registrations = registrationService.getByEmail(email);
            
            // debug
            registrations.forEach(reg -> {
                if (reg.getDoctor() != null) {
                    System.out.println("Registration " + reg.getId() + " - Bac si: " + reg.getDoctor().getFullName());
                }
            });
            
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.out.println("Loi lay lich hen: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // tao dang ky moi
    @PostMapping
    public ResponseEntity<?> createRegistration(@Valid @RequestBody PatientRegistrationDTO dto) {
        try {
            System.out.println("Nhan yeu cau dang ky");
            System.out.println("Ten: " + dto.getFullName() + ", Khoa: " + dto.getDepartment());

            // validation
            if (dto.getFullName() == null || dto.getFullName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Can ho ten");
            }
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Can email");
            }
            if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Can so dt");
            }
            
            // neu co bac si thi can co khung gio
            if (dto.getDoctorId() != null && (dto.getTimeSlot() == null || dto.getTimeSlot().trim().isEmpty())) {
                return ResponseEntity.badRequest().body("Can chon khung gio khi chon bac si");
            }

            PatientRegistration registration = new PatientRegistration();
            registration.setFullName(dto.getFullName().trim());

            // xu ly ngay sinh
            if (dto.getDob() != null && !dto.getDob().isEmpty()) {
                try {
                    registration.setDob(LocalDate.parse(dto.getDob()));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Ngay sinh sai dinh dang");
                }
            } else {
                return ResponseEntity.badRequest().body("Can ngay sinh");
            }

            registration.setGender(dto.getGender());
            registration.setPhone(dto.getPhone().trim());
            registration.setEmail(dto.getEmail().trim());
            registration.setAddress(dto.getAddress());
            registration.setDepartment(dto.getDepartment());
            registration.setSymptoms(dto.getSymptoms());

            // xu ly ngay hen
            if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isEmpty()) {
                try {
                    registration.setAppointmentDate(LocalDate.parse(dto.getAppointmentDate()));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Ngay hen sai dinh dang");
                }
            } else {
                return ResponseEntity.badRequest().body("Can ngay hen");
            }

            // doctorId co the null
            registration.setDoctorId(dto.getDoctorId());

            // time slot co the null
            registration.setAssignedSession(dto.getTimeSlot());

            // set thoi gian va trang thai
            registration.setCreatedAt(LocalDateTime.now());
            registration.setStatus("PROCESSING");

            System.out.println("Goi service xu ly dang ky...");
            System.out.println("Bac si ID: " + registration.getDoctorId());
            System.out.println("Ngay hen: " + registration.getAppointmentDate());
            System.out.println("Khung gio: " + registration.getAssignedSession());
            
            // goi service
            PatientRegistration savedRegistration = registrationService.createRegistration(registration);
            
            // dam bao co registration number
            if (savedRegistration.getRegistrationNumber() == null || 
                savedRegistration.getRegistrationNumber().isEmpty()) {
                savedRegistration.setRegistrationNumber(generateRegistrationNumber());
                savedRegistration = registrationService.save(savedRegistration);
            }
            
            System.out.println("Dang ky thanh cong: " + savedRegistration.getStatus());
            System.out.println("ID: " + savedRegistration.getId());
            System.out.println("So dang ky: " + savedRegistration.getRegistrationNumber());
            
            return ResponseEntity.ok(savedRegistration);

        } catch (Exception e) {
            System.out.println("Loi trong createRegistration: " + e.getMessage());
            return ResponseEntity.status(500).body("Loi server: " + e.getMessage());
        }
    }

    // lay tat ca dang ky (cho admin)
    @GetMapping
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        try {
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            System.out.println("Lay duoc " + registrations.size() + " dang ky");
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.out.println("Loi lay dang ky: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // lay dang ky theo ID
    @GetMapping("/{id}")
    public ResponseEntity<PatientRegistration> getRegistrationById(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registration = registrationService.getById(id);
            if (registration.isPresent()) {
                System.out.println("Tim thay dang ky ID: " + id);
                return ResponseEntity.ok(registration.get());
            } else {
                System.out.println("Khong tim thay dang ky ID: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.out.println("Loi lay theo ID: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // cap nhat dang ky
    @PutMapping("/{id}")
    public ResponseEntity<PatientRegistration> updateRegistration(@PathVariable Long id, 
                                                                 @Valid @RequestBody PatientRegistrationDTO dto) {
        try {
            Optional<PatientRegistration> existingOpt = registrationService.getById(id);
            if (existingOpt.isEmpty()) {
                System.out.println("Khong tim thay de cap nhat: " + id);
                return ResponseEntity.notFound().build();
            }

            PatientRegistration existing = existingOpt.get();
            
            // cap nhat cac truong
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
            
            // neu co doctorId thi can timeSlot
            if (dto.getDoctorId() != null && (dto.getTimeSlot() == null || dto.getTimeSlot().trim().isEmpty())) {
                System.out.println("Loi: co bac si nhung khong co khung gio");
                return ResponseEntity.badRequest().body(null);
            }
            
            existing.setDoctorId(dto.getDoctorId());
            if (dto.getTimeSlot() != null) {
                existing.setAssignedSession(dto.getTimeSlot());
            }

            PatientRegistration updated = registrationService.update(existing);
            System.out.println("Da cap nhat dang ky ID: " + id);
            
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            System.out.println("Loi cap nhat: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // xoa dang ky
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegistration(@PathVariable Long id) {
        try {
            if (!registrationService.existsById(id)) {
                System.out.println("Khong tim thay de xoa: " + id);
                return ResponseEntity.notFound().build();
            }
            registrationService.deleteById(id);
            System.out.println("Da xoa dang ky ID: " + id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.out.println("Loi xoa: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // lay dang ky can xu ly thu cong
    @GetMapping("/manual-review")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsNeedingManualReview() {
        try {
            List<PatientRegistration> registrations = registrationService.getRegistrationsNeedingManualReview();
            System.out.println("Co " + registrations.size() + " dang ky can xu ly thu cong");
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.out.println("Loi lay can xu ly: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // thu duyet don
    @PostMapping("/{id}/try-approve")
    public ResponseEntity<?> tryApproveRegistration(@PathVariable Long id) {
        try {
            System.out.println("Thu duyet don ID: " + id);
            
            PatientRegistration approvedRegistration = registrationService.tryApproveRegistration(id);
            
            System.out.println("Da duyet thanh cong ID: " + id);
            System.out.println("Trang thai moi: " + approvedRegistration.getStatus());
            System.out.println("So thu tu: " + approvedRegistration.getQueueNumber());
            
            return ResponseEntity.ok(approvedRegistration);
            
        } catch (Exception e) {
            System.out.println("Loi duyet don: " + e.getMessage());
            return ResponseEntity.badRequest().body("Khong the duyet don: " + e.getMessage());
        }
    }

    // tu choi don
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody(required = false) String reason) {
        try {
            System.out.println("Tu choi dang ky ID: " + id);
            System.out.println("Ly do: " + (reason != null ? reason : "Khong co ly do"));
            
            PatientRegistration rejectedRegistration = registrationService.rejectRegistration(id, reason);
            
            System.out.println("Da tu choi thanh cong ID: " + id);
            return ResponseEntity.ok(rejectedRegistration);
            
        } catch (Exception e) {
            System.out.println("Loi tu choi: " + e.getMessage());
            return ResponseEntity.badRequest().body("Khong the tu choi: " + e.getMessage());
        }
    }

    // lay dang ky theo so dien thoai
    @GetMapping("/by-phone")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByPhone(@RequestParam String phone) {
        try {
            System.out.println("Tim lich hen cho sdt: " + phone);
            
            List<PatientRegistration> registrations = registrationService.getByPhone(phone);
            
            System.out.println("Tim thay " + registrations.size() + " lich hen");
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.out.println("Loi tim theo sdt: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // lay dang ky theo trang thai
    @GetMapping("/by-status")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByStatus(@RequestParam String status) {
        try {
            System.out.println("Tim lich hen trang thai: " + status);
            
            List<PatientRegistration> registrations = registrationService.getByStatus(status);
            
            System.out.println("Tim thay " + registrations.size() + " lich hen");
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.out.println("Loi tim theo trang thai: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // xu ly thanh toan thanh cong
    @PostMapping("/{id}/payment-success")
    public ResponseEntity<?> processPaymentSuccess(@PathVariable Long id, 
                                                  @RequestBody PaymentRequest paymentRequest) {
        try {
            System.out.println("Xu ly thanh toan thanh cong");
            System.out.println("   - Registration ID: " + id);
            System.out.println("   - So giao dich: " + paymentRequest.getTransactionNumber());
            System.out.println("   - So tien: " + paymentRequest.getAmount());

            PatientRegistration updatedRegistration = registrationService.processPaymentSuccess(
                id, 
                paymentRequest.getTransactionNumber(), 
                paymentRequest.getAmount()
            );

            System.out.println("Da xu ly thanh toan va gui email");
            return ResponseEntity.ok(updatedRegistration);

        } catch (Exception e) {
            System.out.println("Loi xu ly thanh toan: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi xu ly thanh toan: " + e.getMessage());
        }
    }

    // gui email nhac lich
    @PostMapping("/{id}/send-reminder")
    public ResponseEntity<?> sendManualReminder(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registrationOpt = registrationService.getById(id);
            if (registrationOpt.isEmpty()) {
                System.out.println("Khong tim thay de gui nhac: " + id);
                return ResponseEntity.notFound().build();
            }

            PatientRegistration registration = registrationOpt.get();
            System.out.println("Gui email nhac lich cho ID: " + id);
            
            // TODO: goi email service
            
            return ResponseEntity.ok().body("Da gui email nhac lich");

        } catch (Exception e) {
            System.out.println("Loi gui email: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi gui email: " + e.getMessage());
        }
    }

    // tao registration number
    private String generateRegistrationNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int)(Math.random() * 1000));
        return "REG-" + timestamp.substring(timestamp.length() - 8) + "-" + random;
    }

    // inner class cho payment request
    public static class PaymentRequest {
        private String transactionNumber;
        private Double amount;

        public String getTransactionNumber() { return transactionNumber; }
        public void setTransactionNumber(String transactionNumber) { this.transactionNumber = transactionNumber; }
        
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
    }

    // xu ly loi validation
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        BindingResult result = ex.getBindingResult();
        String errorMessage = result.getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        
        System.out.println("Loi validation: " + errorMessage);
        
        return ResponseEntity.badRequest().body("Loi: " + errorMessage);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception ex) {
        System.out.println("Loi chua xu ly: " + ex.getMessage());
        
        return ResponseEntity.status(500).body("Loi server: " + ex.getMessage());
    }
}