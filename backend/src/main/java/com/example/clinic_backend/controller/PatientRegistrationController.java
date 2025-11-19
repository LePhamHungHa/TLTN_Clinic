package com.example.clinic_backend.controller;

import com.example.clinic_backend.dto.PatientRegistrationDTO;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.service.PatientRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    // ENDPOINT - Lấy lịch hẹn theo email
    @GetMapping("/by-email")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByEmail(@RequestParam String email) {
        try {
            System.out.println("📥 Getting registrations for email: " + email);
            
            List<PatientRegistration> registrations = registrationService.getByEmail(email);
            
            System.out.println("✅ Found " + registrations.size() + " registrations for email: " + email);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting registrations by email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // POST method - Tạo đăng ký mới VỚI TÍCH HỢP SLOT
    @PostMapping
    public ResponseEntity<?> createRegistration(@RequestBody PatientRegistrationDTO dto) {
        try {
            System.out.println("=== RECEIVED REGISTRATION REQUEST ===");
            System.out.println("DTO: " + dto.toString());
            System.out.println("================================");

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
            // QUAN TRỌNG: Bỏ validation cho doctorId - có thể null
            // QUAN TRỌNG: Bỏ validation cho timeSlot - có thể null

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

            // QUAN TRỌNG: doctorId có thể là null nếu người dùng không chọn bác sĩ
            registration.setDoctorId(dto.getDoctorId());

            // Xử lý time slot - có thể là null nếu không chọn bác sĩ
            registration.setAssignedSession(dto.getTimeSlot());

            // Set thời gian tạo và status
            registration.setCreatedAt(LocalDateTime.now());
            registration.setStatus("PROCESSING");

            System.out.println("🔄 Gọi service xử lý đăng ký...");
            System.out.println("📋 Thông tin đăng ký:");
            System.out.println("   - Doctor ID: " + registration.getDoctorId());
            System.out.println("   - Appointment Date: " + registration.getAppointmentDate());
            System.out.println("   - Time Slot: " + registration.getAssignedSession());
            
            // GỌI SERVICE XỬ LÝ ĐĂNG KÝ
            PatientRegistration savedRegistration = registrationService.createRegistration(registration);
            
            System.out.println("✅ Registration processed successfully with status: " + savedRegistration.getStatus());
            System.out.println("📋 Registration details:");
            System.out.println("   - ID: " + savedRegistration.getId());
            System.out.println("   - Status: " + savedRegistration.getStatus());
            System.out.println("   - Registration Number: " + savedRegistration.getRegistrationNumber());
            System.out.println("   - Assigned Session: " + savedRegistration.getAssignedSession());
            System.out.println("   - Queue Number: " + savedRegistration.getQueueNumber());
            System.out.println("   - Expected Time: " + savedRegistration.getExpectedTimeSlot());
            System.out.println("   - Room Number: " + savedRegistration.getRoomNumber());
            
            return ResponseEntity.ok(savedRegistration);

        } catch (Exception e) {
            System.err.println("❌ ERROR in createRegistration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error creating registration: " + e.getMessage());
        }
    }

    // Lấy tất cả đăng ký (cho admin)
    @GetMapping
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        try {
            List<PatientRegistration> registrations = registrationService.getAllWithDoctor();
            System.out.println("✅ Retrieved " + registrations.size() + " registrations with doctor info");
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.err.println("❌ Error getting all registrations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy đăng ký theo ID
    @GetMapping("/{id}")
    public ResponseEntity<PatientRegistration> getRegistrationById(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registration = registrationService.getById(id);
            if (registration.isPresent()) {
                System.out.println("✅ Found registration with ID: " + id);
                return ResponseEntity.ok(registration.get());
            } else {
                System.out.println("❌ Registration not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error getting registration by ID: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Cập nhật đăng ký
    @PutMapping("/{id}")
    public ResponseEntity<PatientRegistration> updateRegistration(@PathVariable Long id, 
                                                                 @RequestBody PatientRegistrationDTO dto) {
        try {
            Optional<PatientRegistration> existingOpt = registrationService.getById(id);
            if (existingOpt.isEmpty()) {
                System.out.println("❌ Registration not found for update with ID: " + id);
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
            
            // Cập nhật doctor ID và time slot nếu có
            // QUAN TRỌNG: doctorId có thể là null
            existing.setDoctorId(dto.getDoctorId());
            if (dto.getTimeSlot() != null) {
                existing.setAssignedSession(dto.getTimeSlot());
            }

            PatientRegistration updated = registrationService.update(existing);
            System.out.println("✅ Updated registration with ID: " + id);
            
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            System.err.println("❌ Error updating registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Xóa đăng ký
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegistration(@PathVariable Long id) {
        try {
            if (!registrationService.existsById(id)) {
                System.out.println("❌ Registration not found for deletion with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            registrationService.deleteById(id);
            System.out.println("✅ Deleted registration with ID: " + id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ Error deleting registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy các đăng ký cần xử lý thủ công (cho admin)
    @GetMapping("/manual-review")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsNeedingManualReview() {
        try {
            List<PatientRegistration> registrations = registrationService.getRegistrationsNeedingManualReview();
            System.out.println("✅ Found " + registrations.size() + " registrations needing manual review");
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.err.println("❌ Error getting registrations for manual review: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Thử duyệt đơn thủ công (cho admin)
    @PostMapping("/{id}/try-approve")
    public ResponseEntity<?> tryApproveRegistration(@PathVariable Long id) {
        try {
            System.out.println("🔄 Attempting to manually approve registration with ID: " + id);
            
            PatientRegistration approvedRegistration = registrationService.tryApproveRegistration(id);
            
            System.out.println("✅ Successfully approved registration with ID: " + id);
            System.out.println("📋 Approval details:");
            System.out.println("   - New Status: " + approvedRegistration.getStatus());
            System.out.println("   - Queue Number: " + approvedRegistration.getQueueNumber());
            System.out.println("   - Room Number: " + approvedRegistration.getRoomNumber());
            
            return ResponseEntity.ok(approvedRegistration);
            
        } catch (Exception e) {
            System.err.println("❌ Error trying to approve registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Cannot approve registration: " + e.getMessage());
        }
    }

    // Từ chối đơn (cho admin)
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRegistration(@PathVariable Long id, @RequestBody(required = false) String reason) {
        try {
            System.out.println("🔄 Rejecting registration with ID: " + id);
            System.out.println("Reason: " + (reason != null ? reason : "No reason provided"));
            
            PatientRegistration rejectedRegistration = registrationService.rejectRegistration(id, reason);
            
            System.out.println("✅ Successfully rejected registration with ID: " + id);
            return ResponseEntity.ok(rejectedRegistration);
            
        } catch (Exception e) {
            System.err.println("❌ Error rejecting registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Cannot reject registration: " + e.getMessage());
        }
    }

    // Lấy đăng ký theo số điện thoại
    @GetMapping("/by-phone")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByPhone(@RequestParam String phone) {
        try {
            System.out.println("📥 Getting registrations for phone: " + phone);
            
            List<PatientRegistration> registrations = registrationService.getByPhone(phone);
            
            System.out.println("✅ Found " + registrations.size() + " registrations for phone: " + phone);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting registrations by phone: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Lấy đăng ký theo trạng thái
    @GetMapping("/by-status")
    public ResponseEntity<List<PatientRegistration>> getRegistrationsByStatus(@RequestParam String status) {
        try {
            System.out.println("📥 Getting registrations with status: " + status);
            
            List<PatientRegistration> registrations = registrationService.getByStatus(status);
            
            System.out.println("✅ Found " + registrations.size() + " registrations with status: " + status);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting registrations by status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}