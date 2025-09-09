package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRegistrationRepository extends JpaRepository<PatientRegistration, Long> {
}