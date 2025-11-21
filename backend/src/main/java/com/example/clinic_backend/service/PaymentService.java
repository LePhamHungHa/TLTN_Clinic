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

    public Optional<Payment> findByPatientRegistrationId(Long patientRegistrationId) {
        return paymentRepository.findByPatientRegistrationId(patientRegistrationId);
    }

    /**
     * Cập nhật trạng thái payment và trả về Payment object - THÊM METHOD NÀY
     */
    @Transactional
    public Payment updatePaymentStatus(String transactionNo, String status, String vnpResponseCode) {
        try {
            System.out.println("🔄 Updating payment status: " + transactionNo + " -> " + status);
            
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionNo(transactionNo);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                payment.setStatus(status);
                payment.setVnpResponseCode(vnpResponseCode);
                payment.setUpdatedAt(LocalDateTime.now());
                
                // Nếu thành công, cập nhật thêm thông tin VNPay
                if ("Thành công".equals(status) && vnpResponseCode != null) {
                    payment.setVnpTransactionNo(vnpResponseCode);
                }
                
                Payment savedPayment = paymentRepository.save(payment);
                System.out.println("✅ Payment updated: " + savedPayment.getStatus());

                // Update patient registration status - SỬA LOGIC NÀY
                if ("00".equals(vnpResponseCode) && "Thành công".equals(status)) {
                    Optional<PatientRegistration> registrationOpt = 
                        patientRegistrationRepository.findById(payment.getPatientRegistrationId());
                    if (registrationOpt.isPresent()) {
                        PatientRegistration registration = registrationOpt.get();
                        registration.setPaymentStatus("PAID"); // SỬA: paymentStatus thay vì status
                        registration.setTransactionNumber(transactionNo);
                        
                        // Convert Double to BigDecimal
                        if (payment.getAmount() != null) {
                            registration.setPaidAmount(BigDecimal.valueOf(payment.getAmount())); // SỬA: paidAmount thay vì examinationFee
                        }
                        
                        registration.setPaidAt(LocalDateTime.now());
                        patientRegistrationRepository.save(registration);
                        System.out.println("✅ Updated patient registration payment status: " + registration.getId() + " -> PAID");
                    } else {
                        System.out.println("❌ Patient registration not found: " + payment.getPatientRegistrationId());
                    }
                }
                
                return savedPayment;
            } else {
                System.out.println("❌ Payment not found: " + transactionNo);
                return null;
            }
        } catch (Exception e) {
            System.err.println("❌ Error in updatePaymentStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public void updatePaymentStatusOld(String transactionNo, String status, String vnpResponseCode) {
        updatePaymentStatus(transactionNo, status, vnpResponseCode);
    }
}