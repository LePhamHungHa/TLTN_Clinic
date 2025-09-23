package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByPatientId(Long patientId);
    Optional<Wallet> findByPatient(Patient patient);
}
