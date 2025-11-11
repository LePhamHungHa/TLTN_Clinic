package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient createPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    // Tìm patient bằng user_id
    public Optional<Patient> getPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId);
    }

    public Optional<Patient> findByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    public Optional<Patient> findByUsername(String username) {
        return patientRepository.findByUsername(username);
    }

    public Patient save(Patient patient) {
        return patientRepository.save(patient);
    }

    public Patient updatePatient(Long id, Patient updatedPatient) {
        return patientRepository.findById(id)
                .map(patient -> {
                    // Cập nhật thông tin cá nhân
                    patient.setFullName(updatedPatient.getFullName());
                    patient.setDob(updatedPatient.getDob());
                    patient.setPhone(updatedPatient.getPhone());
                    patient.setAddress(updatedPatient.getAddress());
                    patient.setEmail(updatedPatient.getEmail());
                    patient.setSymptoms(updatedPatient.getSymptoms());
                    patient.setBhyt(updatedPatient.getBhyt());
                    
                    // Cập nhật thông tin người nhà
                    patient.setRelativeName(updatedPatient.getRelativeName());
                    patient.setRelativePhone(updatedPatient.getRelativePhone());
                    patient.setRelativeAddress(updatedPatient.getRelativeAddress());
                    patient.setRelativeRelationship(updatedPatient.getRelativeRelationship());
                    
                    return patientRepository.save(patient);
                })
                .orElse(null);
    }

    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }

    public Optional<Patient> getPatientByUserEmail(String email) {
        return patientRepository.findByUserEmail(email); 
    }

    // THÊM METHOD NÀY - Fix lỗi compilation
    public Optional<Patient> getPatientByEmail(String email) {
        // Sử dụng method có sẵn trong repository
        return patientRepository.findByEmail(email);
    }

    // Tạo patient từ user
    public Patient createPatientFromUser(com.example.clinic_backend.model.User user) {
        Patient patient = new Patient();
        patient.setUser(user);
        patient.setFullName(user.getFullName() != null ? user.getFullName() : user.getUsername());
        patient.setEmail(user.getEmail());
        patient.setPhone(user.getPhone() != null ? user.getPhone() : "");
        patient.setAddress("");
        patient.setBhyt("");
        
        // Khởi tạo thông tin người nhà rỗng
        patient.setRelativeName("");
        patient.setRelativePhone("");
        patient.setRelativeAddress("");
        patient.setRelativeRelationship("");
        
        return patientRepository.save(patient);
    }
}