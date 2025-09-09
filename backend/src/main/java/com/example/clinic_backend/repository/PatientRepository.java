package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByUsername(String username);
    Optional<Patient> findByUserId(Long userId);
}
