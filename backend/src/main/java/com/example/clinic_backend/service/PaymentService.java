package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    private final PaymentRepository repo;

    public PaymentService(PaymentRepository repo) {
        this.repo = repo;
    }

    public Payment savePayment(Payment payment) {
        return repo.save(payment);
    }
}
