package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByPatientId(Long patientId);
    Optional<Wallet> findByPatient(Patient patient);
}
