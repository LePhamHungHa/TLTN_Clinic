package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PatientRegistrationRepository patientRegistrationRepository;

    public PaymentService(PaymentRepository paymentRepository, 
                         PatientRegistrationRepository patientRegistrationRepository) {
        this.paymentRepository = paymentRepository;
        this.patientRegistrationRepository = patientRegistrationRepository;
    }

    public Payment savePayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    public Optional<Payment> findByTransactionNo(String transactionNo) {
        return paymentRepository.findByTransactionNo(transactionNo);
    }

    @Transactional
    public void updatePaymentStatus(String transactionNo, String status, String vnpResponseCode) {
        try {
            System.out.println("🔄 Updating payment status: " + transactionNo + " -> " + status);
            
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionNo(transactionNo);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                payment.setStatus(status);
                payment.setVnpResponseCode(vnpResponseCode);
                payment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(payment);

                System.out.println("✅ Payment updated: " + payment.getStatus());

                // Update patient registration status
                if ("00".equals(vnpResponseCode) && "SUCCESS".equals(status)) {
                    Optional<PatientRegistration> registrationOpt = 
                        patientRegistrationRepository.findById(payment.getPatientRegistrationId());
                    if (registrationOpt.isPresent()) {
                        PatientRegistration registration = registrationOpt.get();
                        registration.setStatus("PAID");
                        
                        // Convert Double to BigDecimal
                        if (payment.getAmount() != null) {
                            registration.setExaminationFee(BigDecimal.valueOf(payment.getAmount()));
                        }
                        
                        patientRegistrationRepository.save(registration);
                        System.out.println("✅ Updated patient registration: " + registration.getId() + " -> PAID");
                    } else {
                        System.out.println("❌ Patient registration not found: " + payment.getPatientRegistrationId());
                    }
                }
            } else {
                System.out.println("❌ Payment not found: " + transactionNo);
            }
        } catch (Exception e) {
            System.err.println("❌ Error in updatePaymentStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}