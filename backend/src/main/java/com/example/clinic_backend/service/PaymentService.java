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

    // Lưu payment vào database
    public Payment savePayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    // Tìm payment theo mã giao dịch
    public Optional<Payment> findByTransactionNo(String transactionNo) {
        return paymentRepository.findByTransactionNo(transactionNo);
    }

    // Tìm payment theo id của đơn đăng ký
    public Optional<Payment> findByPatientRegistrationId(Long patientRegistrationId) {
        return paymentRepository.findByPatientRegistrationId(patientRegistrationId);
    }

    // Cập nhật trạng thái thanh toán
 
    @Transactional
    public Payment updatePaymentStatus(String transactionNo, String status, String vnpResponseCode) {
        try {
            System.out.println("=== Bắt đầu cập nhật trạng thái payment ===");
            System.out.println("Mã giao dịch: " + transactionNo);
            System.out.println("Trạng thái mới: " + status);
            System.out.println("Mã phản hồi VNPay: " + vnpResponseCode);
            
            // Tìm payment theo mã giao dịch
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionNo(transactionNo);
            
            if (!paymentOpt.isPresent()) {
                System.out.println("Không tìm thấy payment với mã: " + transactionNo);
                return null;
            }
            
            Payment payment = paymentOpt.get();
            System.out.println("Đã tìm thấy payment:");
            System.out.println("   ID payment: " + payment.getId());
            System.out.println("   ID đơn đăng ký: " + payment.getPatientRegistrationId());
            System.out.println("   Trạng thái cũ: " + payment.getStatus());
            System.out.println("   Số tiền: " + payment.getAmount());
            
            // Cập nhật thông tin payment
            payment.setStatus(status);
            payment.setVnpResponseCode(vnpResponseCode);
            payment.setUpdatedAt(LocalDateTime.now());
            
            // Nếu thanh toán thành công thì lưu thêm mã giao dịch từ VNPay
            if ("Thành công".equals(status) && vnpResponseCode != null) {
                payment.setVnpTransactionNo(vnpResponseCode);
                System.out.println("Đã lưu mã giao dịch VNPay: " + vnpResponseCode);
            }
            
            // Lưu vào database
            Payment savedPayment = paymentRepository.save(payment);
            System.out.println("Cập nhật payment thành công!");
            System.out.println("Trạng thái mới: " + savedPayment.getStatus());
            System.out.println("Thời gian cập nhật: " + savedPayment.getUpdatedAt());
            System.out.println("Không cập nhật PatientRegistration - VnPayController sẽ làm");
            System.out.println("=== Kết thúc cập nhật payment ===\n");
            
            return savedPayment;
            
        } catch (Exception e) {
            System.out.println("Lỗi khi cập nhật payment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Phương thức cũ, gọi lại phương thức mới
    @Transactional
    public void updatePaymentStatusOld(String transactionNo, String status, String vnpResponseCode) {
        updatePaymentStatus(transactionNo, status, vnpResponseCode);
    }
}