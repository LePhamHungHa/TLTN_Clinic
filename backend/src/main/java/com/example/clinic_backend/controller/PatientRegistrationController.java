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

    // CẬP NHẬT CONSTRUCTOR - THÊM SERVICE
    public PatientRegistrationController(PatientRegistrationRepository registrationRepository, 
                                       PatientRegistrationService registrationService) {
        this.registrationRepository = registrationRepository;
        this.registrationService = registrationService;
    }

    // ... CÁC METHOD HIỆN CÓ GIỮ NGUYÊN ...

    // THÊM ENDPOINT MỚI - Lấy lịch hẹn theo email
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

    // POST method giữ nguyên
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

            registration.setAppointmentTime(dto.getAppointmentTime());

            // Xử lý doctor ID
            if (dto.getDoctorId() != null && !dto.getDoctorId().isEmpty()) {
                try {
                    registration.setDoctorId(Long.parseLong(dto.getDoctorId()));
                } catch (NumberFormatException e) {
                    System.out.println("Warning: Invalid doctor ID format: " + dto.getDoctorId());
                    // Không set doctorId nếu format không hợp lệ
                }
            }

            // Set thời gian tạo
            registration.setCreatedAt(LocalDateTime.now());
            registration.setStatus("PENDING");

            System.out.println("Saving registration: " + registration);
            PatientRegistration savedRegistration = registrationRepository.save(registration);
            
            System.out.println("✅ Registration saved successfully with ID: " + savedRegistration.getId());
            return ResponseEntity.ok(savedRegistration);

        } catch (Exception e) {
            System.err.println("❌ ERROR in createRegistration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error creating registration: " + e.getMessage());
        }
    }

    // Các method khác giữ nguyên
    @GetMapping
    public ResponseEntity<List<PatientRegistration>> getAllRegistrations() {
        try {
            List<PatientRegistration> registrations = registrationRepository.findAll();
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            System.err.println("Error getting all registrations: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientRegistration> getRegistrationById(@PathVariable Long id) {
        try {
            Optional<PatientRegistration> registration = registrationRepository.findById(id);
            return registration.map(ResponseEntity::ok)
                             .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error getting registration by ID: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientRegistration> updateRegistration(@PathVariable Long id, 
                                                                 @RequestBody PatientRegistrationDTO dto) {
        try {
            Optional<PatientRegistration> existingOpt = registrationRepository.findById(id);
            if (existingOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            PatientRegistration existing = existingOpt.get();
            // Update fields từ DTO
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
            if (dto.getAppointmentTime() != null) existing.setAppointmentTime(dto.getAppointmentTime());
            if (dto.getSymptoms() != null) existing.setSymptoms(dto.getSymptoms());
            if (dto.getDoctorId() != null && !dto.getDoctorId().isEmpty()) {
                existing.setDoctorId(Long.parseLong(dto.getDoctorId()));
            }

            PatientRegistration updated = registrationRepository.save(existing);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            System.err.println("Error updating registration: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegistration(@PathVariable Long id) {
        try {
            if (!registrationRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            registrationRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error deleting registration: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}