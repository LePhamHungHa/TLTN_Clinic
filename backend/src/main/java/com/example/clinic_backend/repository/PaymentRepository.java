package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionNo(String transactionNo);
    Optional<Payment> findByPatientRegistrationId(Long patientRegistrationId);
}