package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Invoice;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.InvoiceRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {
    
    @Autowired
    private InvoiceRepository invoiceRepository;
    
    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;
    
    // Tạo số hóa đơn tự động: INV + YYYYMMDD + 6 số ngẫu nhiên
    private String generateInvoiceNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%06d", (int)(Math.random() * 1000000));
        return "INV" + datePart + randomPart;
    }
    
    @Transactional
    public Invoice createInvoiceFromPayment(Long patientRegistrationId, String transactionNo, 
                                           String bankCode, String paymentMethod) {
        try {
            System.out.println("=== 🧾 BẮT ĐẦU TẠO HÓA ĐƠN ===");
            System.out.println("📋 Registration ID: " + patientRegistrationId);
            System.out.println("💰 Transaction No (của chúng ta): " + transactionNo);
            System.out.println("🏦 Bank Code: " + bankCode);
            
            // 1. KIỂM TRA ĐÃ CÓ HÓA ĐƠN CHƯA (bằng registrationId)
            List<Invoice> existingInvoices = invoiceRepository.findByPatientRegistrationId(patientRegistrationId);
            System.out.println("🔍 Tìm thấy " + existingInvoices.size() + " hóa đơn hiện có cho registration này");
            
            if (!existingInvoices.isEmpty()) {
                Invoice existingInvoice = existingInvoices.get(0);
                System.out.println("⚠️ ĐÃ CÓ HÓA ĐƠN: " + existingInvoice.getInvoiceNumber());
                System.out.println("📅 Ngày tạo: " + existingInvoice.getInvoiceDate());
                System.out.println("💵 Số tiền: " + existingInvoice.getAmount());
                System.out.println("🔑 Transaction No: " + existingInvoice.getTransactionNo());
                System.out.println("=== KẾT THÚC (không tạo mới) ===");
                return existingInvoice;
            }
            
            // 2. KIỂM TRA BẰNG TRANSACTION NO (transactionNo của chúng ta)
            if (transactionNo != null && !transactionNo.isEmpty()) {
                Optional<Invoice> invoiceByTransaction = invoiceRepository.findByTransactionNo(transactionNo);
                if (invoiceByTransaction.isPresent()) {
                    Invoice existingInvoice = invoiceByTransaction.get();
                    System.out.println("⚠️ ĐÃ CÓ HÓA ĐƠN với transaction (của chúng ta): " + transactionNo);
                    System.out.println("📜 Số hóa đơn: " + existingInvoice.getInvoiceNumber());
                    System.out.println("=== KẾT THÚC (không tạo mới) ===");
                    return existingInvoice;
                }
            }
            
            // 3. TÌM THÔNG TIN REGISTRATION
            System.out.println("🔍 Đang tìm PatientRegistration với ID: " + patientRegistrationId);
            Optional<PatientRegistration> registrationOpt = patientRegistrationRepository.findById(patientRegistrationId);
            
            if (!registrationOpt.isPresent()) {
                System.err.println("❌ KHÔNG TÌM THẤY PatientRegistration với ID: " + patientRegistrationId);
                System.out.println("=== KẾT THÚC (lỗi) ===");
                return null;
            }
            
            PatientRegistration registration = registrationOpt.get();
            System.out.println("✅ Tìm thấy PatientRegistration:");
            System.out.println("   👤 Tên: " + registration.getFullName());
            System.out.println("   📧 Email: " + registration.getEmail());
            System.out.println("   💰 Examination Fee: " + registration.getExaminationFee());
            System.out.println("   💵 Paid Amount: " + registration.getPaidAmount());
            System.out.println("   📊 Payment Status: " + registration.getPaymentStatus());
            
            // 4. TẠO HÓA ĐƠN MỚI
            System.out.println("🔄 Bắt đầu tạo hóa đơn mới...");
            
            Invoice invoice = new Invoice();
            
            // Số hóa đơn
            String invoiceNumber = generateInvoiceNumber();
            invoice.setInvoiceNumber(invoiceNumber);
            invoice.setPatientRegistrationId(patientRegistrationId);
            
            // Thông tin bệnh nhân
            invoice.setPatientName(registration.getFullName());
            invoice.setPatientEmail(registration.getEmail());
            
            // Số điện thoại
            String phone = extractPhoneFromRegistration(registration);
            System.out.println("📱 Số điện thoại lấy được: " + phone);
            invoice.setPatientPhone(phone);
            
            // Dịch vụ
            invoice.setServiceName("Phí khám bệnh");
            
            // Số tiền - QUAN TRỌNG: Kiểm tra kỹ
            BigDecimal amount = determineInvoiceAmount(registration);
            invoice.setAmount(amount);
            
            // Thông tin thanh toán - LƯU transactionNo CỦA CHÚNG TA
            invoice.setPaymentMethod(paymentMethod);
            invoice.setTransactionNo(transactionNo); // Lưu transactionNo của chúng ta
            invoice.setBankCode(bankCode);
            invoice.setStatus("PAID");
            
            // Ngày tháng
            LocalDateTime now = LocalDateTime.now();
            invoice.setInvoiceDate(now);
            invoice.setPaymentDate(now);
            
            System.out.println("📦 Thông tin hóa đơn đã tạo:");
            System.out.println("   📜 Số hóa đơn: " + invoiceNumber);
            System.out.println("   👤 Tên: " + registration.getFullName());
            System.out.println("   💵 Số tiền: " + amount);
            System.out.println("   🔄 Phương thức: " + paymentMethod);
            System.out.println("   🔑 Transaction No (của chúng ta): " + transactionNo);
            System.out.println("   🏦 Bank Code: " + bankCode);
            
            // 5. LƯU VÀO DATABASE
            try {
                Invoice savedInvoice = invoiceRepository.save(invoice);
                System.out.println("✅ ĐÃ LƯU HÓA ĐƠN THÀNH CÔNG!");
                System.out.println("📊 ID hóa đơn: " + savedInvoice.getId());
                System.out.println("📜 Số hóa đơn: " + savedInvoice.getInvoiceNumber());
                System.out.println("📅 Ngày tạo: " + savedInvoice.getInvoiceDate());
                System.out.println("=== KẾT THÚC (thành công) ===");
                return savedInvoice;
            } catch (Exception saveException) {
                System.err.println("❌ LỖI KHI LƯU HÓA ĐƠN: " + saveException.getMessage());
                saveException.printStackTrace();
                throw saveException;
            }
            
        } catch (Exception e) {
            System.err.println("❌ LỖI TỔNG HỢP KHI TẠO HÓA ĐƠN: " + e.getMessage());
            e.printStackTrace();
            System.out.println("=== KẾT THÚC (lỗi) ===");
            throw new RuntimeException("Failed to create invoice: " + e.getMessage(), e);
        }
    }
    
    // Helper method để xác định số tiền
    private BigDecimal determineInvoiceAmount(PatientRegistration registration) {
        if (registration.getExaminationFee() != null) {
            System.out.println("💰 Lấy số tiền từ Examination Fee: " + registration.getExaminationFee());
            return registration.getExaminationFee();
        } else if (registration.getPaidAmount() != null) {
            System.out.println("💰 Lấy số tiền từ Paid Amount: " + registration.getPaidAmount());
            return registration.getPaidAmount();
        } else {
            BigDecimal defaultAmount = new BigDecimal("250000");
            System.out.println("💰 Dùng số tiền mặc định: " + defaultAmount);
            return defaultAmount;
        }
    }
    
    // Helper method để lấy số điện thoại từ registration
    private String extractPhoneFromRegistration(PatientRegistration registration) {
        try {
            System.out.println("📱 Đang tìm số điện thoại từ PatientRegistration...");
            
            // Thử getPhone() trước
            if (registration.getPhone() != null && !registration.getPhone().isEmpty()) {
                String phone = registration.getPhone();
                System.out.println("   ✅ Tìm thấy qua getPhone(): " + phone);
                return phone;
            }
            
            // Thử các method khác qua reflection
            String[] possibleMethods = {"getPhoneNumber", "getContactPhone", "getMobile", "getContactNumber"};
            
            for (String methodName : possibleMethods) {
                try {
                    java.lang.reflect.Method method = registration.getClass().getMethod(methodName);
                    Object value = method.invoke(registration);
                    if (value != null && !value.toString().isEmpty()) {
                        String phone = value.toString();
                        System.out.println("   ✅ Tìm thấy qua " + methodName + "(): " + phone);
                        return phone;
                    }
                } catch (Exception e) {
                    // Bỏ qua, thử method tiếp theo
                }
            }
            
            System.out.println("   ⚠️ Không tìm thấy số điện thoại, dùng 'N/A'");
            return "N/A";
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi lấy số điện thoại: " + e.getMessage());
            return "N/A";
        }
    }
    
    public Optional<Invoice> getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }
    
    public Optional<Invoice> getInvoiceByTransactionNo(String transactionNo) {
        return invoiceRepository.findByTransactionNo(transactionNo);
    }
    
    public Optional<Invoice> findInvoiceByRegistrationId(Long patientRegistrationId) {
        List<Invoice> invoices = invoiceRepository.findByPatientRegistrationId(patientRegistrationId);
        if (!invoices.isEmpty()) {
            return Optional.of(invoices.get(0));
        }
        return Optional.empty();
    }
    
    public List<Invoice> getInvoicesByPatientRegistrationId(Long patientRegistrationId) {
        return invoiceRepository.findByPatientRegistrationId(patientRegistrationId);
    }
    
    public List<Invoice> getInvoicesByPatientEmailOrPhone(String email, String phone) {
        return invoiceRepository.findByPatientEmailOrPhone(email, phone);
    }
    
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllOrderByInvoiceDateDesc();
    }
    
    public List<Invoice> getInvoicesByStatus(String status) {
        return invoiceRepository.findByStatus(status);
    }
    
    @Transactional
    public Invoice updateInvoiceStatus(String invoiceNumber, String status) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (invoiceOpt.isPresent()) {
            Invoice invoice = invoiceOpt.get();
            invoice.setStatus(status);
            invoice.setUpdatedAt(LocalDateTime.now());
            
            if ("PAID".equals(status) && invoice.getPaymentDate() == null) {
                invoice.setPaymentDate(LocalDateTime.now());
            }
            
            return invoiceRepository.save(invoice);
        }
        return null;
    }
    
    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}