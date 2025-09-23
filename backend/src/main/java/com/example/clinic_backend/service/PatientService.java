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
                patient.setFullName(updatedPatient.getFullName());
                patient.setDob(updatedPatient.getDob());
                patient.setPhone(updatedPatient.getPhone());
                patient.setAddress(updatedPatient.getAddress());
                patient.setEmail(updatedPatient.getEmail());
                patient.setSymptoms(updatedPatient.getSymptoms());
                patient.setBhyt(updatedPatient.getBhyt());
                return patientRepository.save(patient);
            })
            .orElse(null);
}

    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }

    public Optional<Patient> getPatientByEmail(String email) {
        return patientRepository.findByUserEmail(email); 
    }
}
