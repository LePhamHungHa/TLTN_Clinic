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
            System.out.println("Bắt đầu tạo hóa đơn");
            System.out.println("Registration ID: " + patientRegistrationId);
            System.out.println("Transaction No: " + transactionNo);
            System.out.println("Bank Code: " + bankCode);
            
            // Kiểm tra xem đã có hóa đơn chưa (bằng registrationId)
            List<Invoice> existingInvoices = invoiceRepository.findByPatientRegistrationId(patientRegistrationId);
            System.out.println("Tìm thấy " + existingInvoices.size() + " hóa đơn hiện có");
            
            if (!existingInvoices.isEmpty()) {
                Invoice existingInvoice = existingInvoices.get(0);
                System.out.println("Đã có hóa đơn: " + existingInvoice.getInvoiceNumber());
                System.out.println("Ngày tạo: " + existingInvoice.getInvoiceDate());
                System.out.println("Số tiền: " + existingInvoice.getAmount());
                System.out.println("Transaction No: " + existingInvoice.getTransactionNo());
                return existingInvoice;
            }
            
            // Kiểm tra bằng transaction no
            if (transactionNo != null && !transactionNo.isEmpty()) {
                Optional<Invoice> invoiceByTransaction = invoiceRepository.findByTransactionNo(transactionNo);
                if (invoiceByTransaction.isPresent()) {
                    Invoice existingInvoice = invoiceByTransaction.get();
                    System.out.println("Đã có hóa đơn với transaction: " + transactionNo);
                    System.out.println("Số hóa đơn: " + existingInvoice.getInvoiceNumber());
                    return existingInvoice;
                }
            }
            
            // Tìm thông tin registration
            System.out.println("Đang tìm PatientRegistration với ID: " + patientRegistrationId);
            Optional<PatientRegistration> registrationOpt = patientRegistrationRepository.findById(patientRegistrationId);
            
            if (!registrationOpt.isPresent()) {
                System.out.println("Không tìm thấy PatientRegistration với ID: " + patientRegistrationId);
                return null;
            }
            
            PatientRegistration registration = registrationOpt.get();
            System.out.println("Tìm thấy PatientRegistration:");
            System.out.println("Tên: " + registration.getFullName());
            System.out.println("Email: " + registration.getEmail());
            System.out.println("Examination Fee: " + registration.getExaminationFee());
            System.out.println("Paid Amount: " + registration.getPaidAmount());
            System.out.println("Payment Status: " + registration.getPaymentStatus());
            
            // Tạo hóa đơn mới
            System.out.println("Bắt đầu tạo hóa đơn mới...");
            
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
            System.out.println("Số điện thoại lấy được: " + phone);
            invoice.setPatientPhone(phone);
            
            // Dịch vụ
            invoice.setServiceName("Phí khám bệnh");
            
            // Số tiền
            BigDecimal amount = determineInvoiceAmount(registration);
            invoice.setAmount(amount);
            
            // Thông tin thanh toán
            invoice.setPaymentMethod(paymentMethod);
            invoice.setTransactionNo(transactionNo);
            invoice.setBankCode(bankCode);
            invoice.setStatus("PAID");
            
            // Ngày tháng
            LocalDateTime now = LocalDateTime.now();
            invoice.setInvoiceDate(now);
            invoice.setPaymentDate(now);
            
            System.out.println("Thông tin hóa đơn đã tạo:");
            System.out.println("Số hóa đơn: " + invoiceNumber);
            System.out.println("Tên: " + registration.getFullName());
            System.out.println("Số tiền: " + amount);
            System.out.println("Phương thức: " + paymentMethod);
            System.out.println("Transaction No: " + transactionNo);
            System.out.println("Bank Code: " + bankCode);
            
            // Lưu vào database
            try {
                Invoice savedInvoice = invoiceRepository.save(invoice);
                System.out.println("Đã lưu hóa đơn thành công!");
                System.out.println("ID hóa đơn: " + savedInvoice.getId());
                System.out.println("Số hóa đơn: " + savedInvoice.getInvoiceNumber());
                System.out.println("Ngày tạo: " + savedInvoice.getInvoiceDate());
                return savedInvoice;
            } catch (Exception saveException) {
                System.out.println("Lỗi khi lưu hóa đơn: " + saveException.getMessage());
                saveException.printStackTrace();
                throw saveException;
            }
            
        } catch (Exception e) {
            System.out.println("Lỗi khi tạo hóa đơn: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create invoice: " + e.getMessage(), e);
        }
    }
    
    // Xác định số tiền cho hóa đơn
    private BigDecimal determineInvoiceAmount(PatientRegistration registration) {
        if (registration.getExaminationFee() != null) {
            System.out.println("Lấy số tiền từ Examination Fee: " + registration.getExaminationFee());
            return registration.getExaminationFee();
        } else if (registration.getPaidAmount() != null) {
            System.out.println("Lấy số tiền từ Paid Amount: " + registration.getPaidAmount());
            return registration.getPaidAmount();
        } else {
            BigDecimal defaultAmount = new BigDecimal("250000");
            System.out.println("Dùng số tiền mặc định: " + defaultAmount);
            return defaultAmount;
        }
    }
    
    // Lấy số điện thoại từ registration
    private String extractPhoneFromRegistration(PatientRegistration registration) {
        try {
            System.out.println("Đang tìm số điện thoại từ PatientRegistration...");
            
            // Thử getPhone() trước
            if (registration.getPhone() != null && !registration.getPhone().isEmpty()) {
                String phone = registration.getPhone();
                System.out.println("Tìm thấy qua getPhone(): " + phone);
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
                        System.out.println("Tìm thấy qua " + methodName + "(): " + phone);
                        return phone;
                    }
                } catch (Exception e) {
                    // Bỏ qua, thử method tiếp theo
                }
            }
            
            System.out.println("Không tìm thấy số điện thoại, dùng 'N/A'");
            return "N/A";
            
        } catch (Exception e) {
            System.out.println("Lỗi khi lấy số điện thoại: " + e.getMessage());
            return "N/A";
        }
    }
    
    // Lấy hóa đơn theo số hóa đơn
    public Optional<Invoice> getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }
    
    // Lấy hóa đơn theo transaction no
    public Optional<Invoice> getInvoiceByTransactionNo(String transactionNo) {
        return invoiceRepository.findByTransactionNo(transactionNo);
    }
    
    // Tìm hóa đơn theo registration id
    public Optional<Invoice> findInvoiceByRegistrationId(Long patientRegistrationId) {
        List<Invoice> invoices = invoiceRepository.findByPatientRegistrationId(patientRegistrationId);
        if (!invoices.isEmpty()) {
            return Optional.of(invoices.get(0));
        }
        return Optional.empty();
    }
    
    // Lấy danh sách hóa đơn theo registration id
    public List<Invoice> getInvoicesByPatientRegistrationId(Long patientRegistrationId) {
        return invoiceRepository.findByPatientRegistrationId(patientRegistrationId);
    }
    
    // Lấy danh sách hóa đơn theo email hoặc phone
    public List<Invoice> getInvoicesByPatientEmailOrPhone(String email, String phone) {
        return invoiceRepository.findByPatientEmailOrPhone(email, phone);
    }
    
    // Lấy tất cả hóa đơn
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllOrderByInvoiceDateDesc();
    }
    
    // Lấy hóa đơn theo trạng thái
    public List<Invoice> getInvoicesByStatus(String status) {
        return invoiceRepository.findByStatus(status);
    }
    
    // Cập nhật trạng thái hóa đơn
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
    
    // Xóa hóa đơn
    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
    
    // Tìm kiếm hóa đơn (đơn giản hóa)
    public List<Invoice> searchInvoices(String keyword, String status) {
        try {
            if (status != null && !status.isEmpty()) {
                return getInvoicesByStatus(status);
            } 
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                // Tìm kiếm đơn giản - trước mắt trả về tất cả
                // Có thể implement tìm kiếm nâng cao sau
                return getAllInvoices();
            } 
            
            return getAllInvoices();
            
        } catch (Exception e) {
            System.out.println("Lỗi khi tìm kiếm hóa đơn: " + e.getMessage());
            return getAllInvoices();
        }
    }
    
    // Lấy hóa đơn theo khoảng thời gian
    public List<Invoice> getInvoicesByDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        try {
            // Tạm thời trả về tất cả
            // Có thể implement query theo ngày sau
            return getAllInvoices();
        } catch (Exception e) {
            System.out.println("Lỗi khi lấy hóa đơn theo ngày: " + e.getMessage());
            return getAllInvoices();
        }
    }
}