package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * Cập nhật trạng thái payment - CHỈ CẬP NHẬT PAYMENT, KHÔNG CẬP NHẬT PATIENTREGISTRATION
     */
    @Transactional
    public Payment updatePaymentStatus(String transactionNo, String status, String vnpResponseCode) {
        try {
            System.out.println("=== 🧾 PAYMENT SERVICE - CẬP NHẬT TRẠNG THÁI ===");
            System.out.println("🔑 Transaction No: " + transactionNo);
            System.out.println("📊 New Status: " + status);
            System.out.println("📋 VNP Response Code: " + vnpResponseCode);
            
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionNo(transactionNo);
            
            if (!paymentOpt.isPresent()) {
                System.err.println("❌ [PaymentService] Payment not found: " + transactionNo);
                return null;
            }
            
            Payment payment = paymentOpt.get();
            System.out.println("✅ [PaymentService] Found payment:");
            System.out.println("   🆔 ID: " + payment.getId());
            System.out.println("   🆔 Patient Registration ID: " + payment.getPatientRegistrationId());
            System.out.println("   📊 Current Status: " + payment.getStatus());
            System.out.println("   💰 Amount: " + payment.getAmount());
            
            // Cập nhật thông tin payment
            payment.setStatus(status);
            payment.setVnpResponseCode(vnpResponseCode);
            payment.setUpdatedAt(LocalDateTime.now());
            
            // Lưu transactionNo từ VNPay nếu có
            if ("Thành công".equals(status) && vnpResponseCode != null) {
                payment.setVnpTransactionNo(vnpResponseCode);
                System.out.println("💾 Lưu VNP Transaction No: " + vnpResponseCode);
            }
            
            Payment savedPayment = paymentRepository.save(payment);
            System.out.println("✅ [PaymentService] Payment updated successfully!");
            System.out.println("📊 New status: " + savedPayment.getStatus());
            System.out.println("📅 Updated at: " + savedPayment.getUpdatedAt());
            
            // ❌ BỎ LOGIC UPDATE PATIENTREGISTRATION TẠI ĐÂY
            // Để VnPayController làm việc này để tránh trùng lặp và transaction conflict
            System.out.println("ℹ️ [PaymentService] Skipping PatientRegistration update - Let VnPayController handle it");
            System.out.println("=== 🧾 PAYMENT SERVICE - HOÀN TẤT ===\n");
            
            return savedPayment;
            
        } catch (Exception e) {
            System.err.println("❌ [PaymentService] Error in updatePaymentStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public void updatePaymentStatusOld(String transactionNo, String status, String vnpResponseCode) {
        updatePaymentStatus(transactionNo, status, vnpResponseCode);
    }
}