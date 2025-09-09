package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/patient-registrations")
@CrossOrigin(origins = {"http://localhost:5173"})
public class PatientRegistrationController {

    private final PatientRegistrationRepository registrationRepository;

    public PatientRegistrationController(PatientRegistrationRepository registrationRepository) {
        this.registrationRepository = registrationRepository;
    }

    @PostMapping
    public ResponseEntity<PatientRegistration> createRegistration(@RequestBody PatientRegistrationDTO dto) {
        PatientRegistration registration = new PatientRegistration();

        registration.setFullName(dto.getFullName());

        // Xử lý DOB an toàn
        if (dto.getDob() != null && !dto.getDob().isEmpty()) {
            registration.setDob(LocalDate.parse(dto.getDob()));
        }

        registration.setGender(dto.getGender());
        registration.setPhone(dto.getPhone());
        registration.setEmail(dto.getEmail());
        registration.setAddress(dto.getAddress());
        registration.setDepartment(dto.getDepartment());

        // Xử lý ngày hẹn
        if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isEmpty()) {
            registration.setAppointmentDate(LocalDate.parse(dto.getAppointmentDate()));
        }

        registration.setAppointmentTime(dto.getAppointmentTime());
        registration.setSymptoms(dto.getSymptoms());

        // Không cần nhận createdAt từ frontend → backend tự set
        // registration.setCreatedAt(LocalDateTime.now());

        PatientRegistration saved = registrationRepository.save(registration);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<PatientRegistration> getAllRegistrations() {
        return registrationRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientRegistration> getRegistrationById(@PathVariable Long id) {
        return registrationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRegistration(@PathVariable Long id) {
        if (!registrationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        registrationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

class PatientRegistrationDTO {
    private String fullName;
    private String dob;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String department;
    private String appointmentDate;
    private String appointmentTime;
    private String symptoms;
    private String createdAt;

    // Getters và Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }
    public String getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
