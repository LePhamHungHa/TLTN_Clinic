package com.example.clinic_backend.service;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientRegistrationService {

    private final PatientRegistrationRepository repository;

    public PatientRegistrationService(PatientRegistrationRepository repository) {
        this.repository = repository;
    }

    // Lấy toàn bộ lịch hẹn
    public List<PatientRegistration> getAll() {
        return repository.findAll();
    }

    // Lấy lịch hẹn theo ID
    public Optional<PatientRegistration> getById(Long id) {
        return repository.findById(id);
    }

    // Lấy lịch hẹn theo email - ĐÃ SỬA ĐỂ JOIN VỚI DOCTOR
    public List<PatientRegistration> getByEmail(String email) {
        try {
            // ƯU TIÊN: Dùng query có JOIN FETCH để lấy thông tin bác sĩ
            System.out.println("🔄 Fetching appointments with doctor info for email: " + email);
            List<PatientRegistration> result = repository.findByEmailWithDoctor(email);
            
            if (!result.isEmpty()) {
                System.out.println("✅ Found " + result.size() + " appointments with doctor info");
                // Log thông tin bác sĩ để debug
                result.forEach(appointment -> {
                    if (appointment.getDoctor() != null) {
                        System.out.println("👨‍⚕️ Doctor: " + appointment.getDoctor().getFullName() + 
                                         " - Degree: " + appointment.getDoctor().getDegree());
                    }
                });
                return result;
            }
            
            // Fallback: query thường không có join
            System.out.println("🔄 No results with join, trying regular query");
            result = repository.findByEmail(email);
            System.out.println("✅ Found " + result.size() + " appointments using regular query");
            return result;
            
        } catch (Exception e) {
            System.out.println("❌ Query with join failed: " + e.getMessage());
            // Fallback cuối cùng
            return repository.findByEmail(email);
        }
    }

    // ... Các method khác giữ nguyên
    public PatientRegistration save(PatientRegistration registration) {
        return repository.save(registration);
    }

    public PatientRegistration update(PatientRegistration registration) {
        return repository.save(registration);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public List<PatientRegistration> getByPhone(String phone) {
        return repository.findByPhone(phone);
    }

    public List<PatientRegistration> getByStatus(String status) {
        return repository.findByStatus(status);
    }
}