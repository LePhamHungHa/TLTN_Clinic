package com.example.clinic_backend.controller;

import com.example.clinic_backend.config.VNPayConfig;
import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.service.EmailService;
import com.example.clinic_backend.service.PaymentService;
import com.example.clinic_backend.service.InvoiceService;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/vnpay")
public class VnPayController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final PatientRegistrationRepository patientRegistrationRepository;
    private final InvoiceService invoiceService;

    public VnPayController(PaymentService paymentService, 
                          PaymentRepository paymentRepository,
                          EmailService emailService,
                          PatientRegistrationRepository patientRegistrationRepository,
                          InvoiceService invoiceService) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
        this.patientRegistrationRepository = patientRegistrationRepository;
        this.invoiceService = invoiceService;
    }

    // ==================== API PUBLIC ====================
    
    @GetMapping("/public/registrations/{registrationId}/payment-status")
    public ResponseEntity<Map<String, Object>> getPaymentStatusByRegistrationId(
            @PathVariable Long registrationId) {
        
        try {
            System.out.println("🔍 PUBLIC - Kiểm tra trạng thái thanh toán cho registration: " + registrationId);
            
            Optional<Payment> paymentOpt = paymentRepository.findByPatientRegistrationId(registrationId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                
                result.put("paymentStatus", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("paymentDate", payment.getUpdatedAt());
                result.put("transactionNo", payment.getTransactionNo());
                result.put("patientRegistrationId", payment.getPatientRegistrationId());
                
                // Kiểm tra xem đã có hóa đơn chưa
                if ("Thành công".equals(payment.getStatus())) {
                    Optional<com.example.clinic_backend.model.Invoice> invoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(payment.getPatientRegistrationId());
                    
                    if (invoiceOpt.isPresent()) {
                        com.example.clinic_backend.model.Invoice invoice = invoiceOpt.get();
                        result.put("invoiceNumber", invoice.getInvoiceNumber());
                        result.put("invoiceDate", invoice.getInvoiceDate());
                        result.put("hasInvoice", true);
                        System.out.println("📄 Tìm thấy hóa đơn: " + invoice.getInvoiceNumber());
                    } else {
                        result.put("hasInvoice", false);
                        System.out.println("⚠️ Không tìm thấy hóa đơn mặc dù đã thanh toán");
                    }
                }
                
                System.out.println("✅ PUBLIC - Tìm thấy payment: " + payment.getStatus());
            } else {
                result.put("paymentStatus", "Chưa thanh toán");
                result.put("amount", null);
                result.put("paymentDate", null);
                result.put("transactionNo", null);
                result.put("patientRegistrationId", registrationId);
                result.put("hasInvoice", false);
                
                System.out.println("ℹ️ PUBLIC - Không tìm thấy payment");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("❌ PUBLIC - Lỗi khi lấy trạng thái thanh toán: " + e.getMessage());
            
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("paymentStatus", "Chưa thanh toán");
            errorResult.put("amount", null);
            errorResult.put("paymentDate", null);
            errorResult.put("transactionNo", null);
            errorResult.put("patientRegistrationId", registrationId);
            errorResult.put("hasInvoice", false);
            errorResult.put("error", "Lỗi hệ thống");
            
            return ResponseEntity.ok(errorResult);
        }
    }

    // ==================== VNPAY TRANSACTION ENDPOINTS ====================

    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> req, HttpServletRequest request) {
        try {
            System.out.println("=== 🚀 BẮT ĐẦU TẠO THANH TOÁN VNPAY ===");
            System.out.println("📦 Dữ liệu request: " + req);
            
            long amount = ((Number) req.get("amount")).longValue() * 100;
            String orderInfo = (String) req.get("orderInfo");
            Long patientRegistrationId = req.get("patientRegistrationId") != null ? 
                ((Number) req.get("patientRegistrationId")).longValue() : null;

            System.out.println("💰 Số tiền: " + amount + " (VNĐ x 100)");
            System.out.println("📝 Thông tin đơn: " + orderInfo);
            System.out.println("🆔 ID Registration: " + patientRegistrationId);

            if (patientRegistrationId == null) {
                throw new Exception("patientRegistrationId là bắt buộc");
            }

            // Kiểm tra xem đã có thanh toán thành công cho registration này chưa
            Optional<Payment> existingPaymentOpt = paymentRepository.findByPatientRegistrationId(patientRegistrationId);
            if (existingPaymentOpt.isPresent()) {
                Payment existingPayment = existingPaymentOpt.get();
                if ("Thành công".equals(existingPayment.getStatus())) {
                    System.out.println("⚠️ Đã có thanh toán thành công cho registration này: " + patientRegistrationId);
                    Map<String, Object> warning = new HashMap<>();
                    warning.put("warning", "Đơn hàng đã được thanh toán thành công trước đó");
                    warning.put("existingTransactionNo", existingPayment.getTransactionNo());
                    warning.put("paymentStatus", existingPayment.getStatus());
                    return ResponseEntity.ok(warning);
                }
            }

            // Sinh mã giao dịch
            String vnp_TxnRef = "VNPAY-" + System.currentTimeMillis() + "-" + patientRegistrationId;
            String vnp_IpAddr = getClientIpAddress(request);
            
            System.out.println("🔑 Transaction Ref: " + vnp_TxnRef);
            System.out.println("🌐 IP Address: " + vnp_IpAddr);

            // Tạo map tham số
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", VNPayConfig.vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", orderInfo);
            vnp_Params.put("vnp_OrderType", "billpayment");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String createDate = formatter.format(cal.getTime());
            vnp_Params.put("vnp_CreateDate", createDate);

            // Tạo URL thanh toán
            String paymentUrl = createPaymentUrl(vnp_Params);
            System.out.println("🔗 Payment URL đã tạo: " + paymentUrl);

            // Lưu thông tin thanh toán vào database
            Payment payment = new Payment();
            payment.setPatientRegistrationId(patientRegistrationId);
            payment.setAmount((double) amount / 100);
            payment.setOrderInfo(orderInfo);
            payment.setTransactionNo(vnp_TxnRef);
            payment.setStatus("Đang chờ xử lý");
            
            Payment savedPayment = paymentService.savePayment(payment);
            System.out.println("💾 Đã lưu payment với ID: " + savedPayment.getId());

            Map<String, String> result = new HashMap<>();
            result.put("paymentUrl", paymentUrl);
            result.put("transactionNo", vnp_TxnRef);
            
            System.out.println("✅ Tạo thanh toán thành công!");
            System.out.println("=== KẾT THÚC TẠO THANH TOÁN ===");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ Lỗi tạo thanh toán: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể tạo giao dịch: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/payment-return")
    @Transactional
    public ResponseEntity<Map<String, String>> paymentReturn(@RequestParam Map<String, String> params) {
        System.out.println("\n=== 🔄 VNPAY RETURN URL - BẮT ĐẦU ===");
        System.out.println("📦 Tham số return từ VNPay: " + params);
        
        String vnp_ResponseCode = params.get("vnp_ResponseCode");
        String vnp_TransactionNo = params.get("vnp_TransactionNo"); // TransactionNo từ VNPay
        String vnp_TxnRef = params.get("vnp_TxnRef"); // TransactionNo của chúng ta
        String vnp_Amount = params.get("vnp_Amount");
        String vnp_BankCode = params.get("vnp_BankCode");
        String vnp_PayDate = params.get("vnp_PayDate");
        String vnp_BankTranNo = params.get("vnp_BankTranNo");
        
        System.out.println("📊 Thông tin giao dịch:");
        System.out.println("   📋 Response Code: " + vnp_ResponseCode);
        System.out.println("   🔑 Transaction No (VNPay): " + vnp_TransactionNo);
        System.out.println("   🔑 TxnRef (của chúng ta): " + vnp_TxnRef);
        System.out.println("   💰 Amount: " + vnp_Amount + " (đơn vị: VNĐ x 100)");
        System.out.println("   🏦 Bank Code: " + vnp_BankCode);
        System.out.println("   📅 Pay Date: " + vnp_PayDate);
        
        Map<String, String> result = new HashMap<>();
        
        if ("00".equals(vnp_ResponseCode)) {
            System.out.println("✅ THANH TOÁN THÀNH CÔNG!");
            
            try {
                // 1. Kiểm tra xem payment đã được xử lý chưa
                System.out.println("🔍 Kiểm tra payment với TxnRef (của chúng ta): " + vnp_TxnRef);
                Optional<Payment> paymentCheckOpt = paymentService.findByTransactionNo(vnp_TxnRef);
                
                if (!paymentCheckOpt.isPresent()) {
                    System.err.println("❌ Không tìm thấy payment với TxnRef: " + vnp_TxnRef);
                    result.put("status", "error");
                    result.put("message", "Không tìm thấy thông tin giao dịch");
                    return ResponseEntity.ok(result);
                }
                
                Payment existingPayment = paymentCheckOpt.get();
                System.out.println("📋 Payment hiện tại:");
                System.out.println("   🆔 ID: " + existingPayment.getId());
                System.out.println("   📊 Status: " + existingPayment.getStatus());
                System.out.println("   🆔 Registration ID: " + existingPayment.getPatientRegistrationId());
                
                // Nếu đã xử lý thành công rồi
                if ("Thành công".equals(existingPayment.getStatus())) {
                    System.out.println("⚠️ Payment đã được xử lý thành công trước đó");
                    
                    // Kiểm tra hóa đơn
                    Optional<com.example.clinic_backend.model.Invoice> existingInvoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(existingPayment.getPatientRegistrationId());
                    
                    result.put("status", "success");
                    result.put("message", "Thanh toán đã được xử lý thành công trước đó");
                    result.put("amount", String.valueOf(existingPayment.getAmount()));
                    result.put("paymentStatus", "Thành công");
                    result.put("transactionNo", vnp_TransactionNo);
                    
                    if (existingInvoiceOpt.isPresent()) {
                        result.put("invoiceNumber", existingInvoiceOpt.get().getInvoiceNumber());
                        result.put("invoiceDate", existingInvoiceOpt.get().getInvoiceDate().toString());
                        System.out.println("📄 Đã có hóa đơn: " + existingInvoiceOpt.get().getInvoiceNumber());
                    } else {
                        System.out.println("⚠️ Không tìm thấy hóa đơn mặc dù payment đã thành công");
                    }
                    
                    System.out.println("=== KẾT THÚC (đã xử lý trước đó) ===");
                    return ResponseEntity.ok(result);
                }
                
                // 2. Cập nhật trạng thái thanh toán
                System.out.println("🔄 Cập nhật trạng thái payment...");
                Payment updatedPayment = paymentService.updatePaymentStatus(vnp_TxnRef, "Thành công", vnp_ResponseCode);
                
                if (updatedPayment == null) {
                    System.err.println("❌ Không thể cập nhật payment");
                    throw new Exception("Không thể cập nhật payment");
                }
                
                System.out.println("✅ Đã cập nhật payment thành công");
                System.out.println("📊 Payment sau khi cập nhật:");
                System.out.println("   🆔 Registration ID: " + updatedPayment.getPatientRegistrationId());
                System.out.println("   📊 Status: " + updatedPayment.getStatus());
                System.out.println("   📅 Updated At: " + updatedPayment.getUpdatedAt());
                
                // 3. Cập nhật PatientRegistration
                if (updatedPayment.getPatientRegistrationId() != null) {
                    System.out.println("🔍 Đang tìm PatientRegistration với ID: " + updatedPayment.getPatientRegistrationId());
                    Optional<PatientRegistration> registrationOpt = patientRegistrationRepository
                        .findById(updatedPayment.getPatientRegistrationId());
                    
                    if (registrationOpt.isPresent()) {
                        PatientRegistration registration = registrationOpt.get();
                        
                        System.out.println("✅ Tìm thấy PatientRegistration:");
                        System.out.println("   👤 Tên: " + registration.getFullName());
                        System.out.println("   📧 Email: " + registration.getEmail());
                        System.out.println("   💰 Trạng thái thanh toán cũ: " + registration.getPaymentStatus());
                        
                        // Chỉ cập nhật nếu chưa PAID
                        if (!"PAID".equals(registration.getPaymentStatus())) {
                            System.out.println("🔄 Cập nhật PatientRegistration...");
                            
                            // Chuyển đổi amount từ VNPay (đã x100) sang VNĐ thực
                            double amountInVND = Double.parseDouble(vnp_Amount) / 100;
                            
                            registration.setPaymentStatus("PAID");
                            registration.setTransactionNumber(vnp_TransactionNo);
                            registration.setPaidAmount(java.math.BigDecimal.valueOf(amountInVND));
                            registration.setPaidAt(LocalDateTime.now());
                            
                            PatientRegistration savedRegistration = patientRegistrationRepository.save(registration);
                            System.out.println("✅ Đã cập nhật PatientRegistration:");
                            System.out.println("   💵 Số tiền đã thanh toán: " + amountInVND);
                            System.out.println("   📅 Thời gian thanh toán: " + registration.getPaidAt());
                            System.out.println("   🔑 Transaction No (VNPay): " + registration.getTransactionNumber());
                            
                            // 4. Gửi email thông báo
                            try {
                                System.out.println("📧 Đang gửi email thông báo...");
                                emailService.sendPaymentSuccessEmail(savedRegistration);
                                System.out.println("✅ Đã gửi email thành công cho: " + savedRegistration.getEmail());
                            } catch (Exception emailException) {
                                System.err.println("⚠️ Lỗi gửi email: " + emailException.getMessage());
                            }
                            
                            // 5. TẠO HÓA ĐƠN - FIX LỖI QUAN TRỌNG: Dùng vnp_TxnRef thay vì vnp_TransactionNo
                            System.out.println("🧾 BẮT ĐẦU TẠO HÓA ĐƠN...");
                            System.out.println("🔍 Thông tin tạo hóa đơn:");
                            System.out.println("   🆔 Registration ID: " + updatedPayment.getPatientRegistrationId());
                            System.out.println("   🔑 Transaction No (của chúng ta): " + vnp_TxnRef);
                            System.out.println("   🔑 Transaction No (VNPay): " + vnp_TransactionNo);
                            
                            try {
                                // Kiểm tra trước xem đã có hóa đơn chưa
                                Optional<com.example.clinic_backend.model.Invoice> existingInvoiceCheck = 
                                    invoiceService.findInvoiceByRegistrationId(updatedPayment.getPatientRegistrationId());
                                
                                if (existingInvoiceCheck.isPresent()) {
                                    System.out.println("⚠️ Đã có hóa đơn cho registration này, không tạo mới");
                                    com.example.clinic_backend.model.Invoice existingInvoice = existingInvoiceCheck.get();
                                    result.put("invoiceNumber", existingInvoice.getInvoiceNumber());
                                    result.put("invoiceDate", existingInvoice.getInvoiceDate().toString());
                                    System.out.println("📄 Số hóa đơn đã có: " + existingInvoice.getInvoiceNumber());
                                } else {
                                    // Tạo hóa đơn mới - Dùng vnp_TxnRef (transactionNo của chúng ta)
                                    com.example.clinic_backend.model.Invoice invoice = invoiceService.createInvoiceFromPayment(
                                        updatedPayment.getPatientRegistrationId(),
                                        vnp_TxnRef, // FIX: Dùng transactionNo của chúng ta
                                        vnp_BankCode,
                                        "VNPay"
                                    );
                                    
                                    if (invoice != null) {
                                        result.put("invoiceNumber", invoice.getInvoiceNumber());
                                        result.put("invoiceDate", invoice.getInvoiceDate().toString());
                                        System.out.println("🎉 ĐÃ TẠO HÓA ĐƠN THÀNH CÔNG!");
                                        System.out.println("   📜 Số hóa đơn: " + invoice.getInvoiceNumber());
                                        System.out.println("   📅 Ngày hóa đơn: " + invoice.getInvoiceDate());
                                    } else {
                                        System.err.println("❌ InvoiceService.createInvoiceFromPayment() trả về null!");
                                        result.put("invoiceError", "Không thể tạo hóa đơn");
                                    }
                                }
                            } catch (Exception invoiceException) {
                                System.err.println("❌ LỖI KHI TẠO HÓA ĐƠN: " + invoiceException.getMessage());
                                invoiceException.printStackTrace();
                                result.put("invoiceError", "Lỗi khi tạo hóa đơn: " + invoiceException.getMessage());
                            }
                            
                        } else {
                            System.out.println("ℹ️ Registration đã được thanh toán từ trước");
                        }
                    } else {
                        System.err.println("❌ Không tìm thấy PatientRegistration với ID: " + updatedPayment.getPatientRegistrationId());
                    }
                } else {
                    System.err.println("❌ Payment không có patientRegistrationId");
                }
                
            } catch (Exception e) {
                System.err.println("❌ Lỗi khi xử lý thanh toán thành công: " + e.getMessage());
                e.printStackTrace();
            }
            
            result.put("status", "success");
            result.put("message", "Thanh toán thành công!");
            result.put("amount", String.valueOf(Double.parseDouble(vnp_Amount) / 100));
            result.put("paymentStatus", "Thành công");
            result.put("transactionNo", vnp_TransactionNo);
            result.put("bankCode", vnp_BankCode);
            
            System.out.println("✅ Xử lý thanh toán hoàn tất!");
            
        } else {
            // Thanh toán thất bại
            System.out.println("❌ THANH TOÁN THẤT BẠI! Mã lỗi: " + vnp_ResponseCode);
            
            try {
                paymentService.updatePaymentStatus(vnp_TxnRef, "Thất bại", vnp_ResponseCode);
                System.out.println("🔄 Đã cập nhật trạng thái payment thành 'Thất bại'");
            } catch (Exception e) {
                System.err.println("⚠️ Không thể cập nhật trạng thái payment thất bại: " + e.getMessage());
            }
            
            result.put("status", "error");
            result.put("message", "Thanh toán thất bại! Mã lỗi: " + vnp_ResponseCode);
            result.put("paymentStatus", "Thất bại");
        }
        
        System.out.println("📤 Kết quả trả về: " + result);
        System.out.println("=== 🔄 VNPAY RETURN URL - KẾT THÚC ===\n");
        return ResponseEntity.ok(result);
    }

    // ==================== PAYMENT STATUS ENDPOINTS ====================

    @PostMapping("/check-payment-status")
    public ResponseEntity<?> checkPaymentStatus(@RequestBody Map<String, String> request) {
        try {
            String transactionNo = request.get("transactionNo");
            System.out.println("🔍 Kiểm tra trạng thái thanh toán cho: " + transactionNo);
            
            Optional<Payment> paymentOpt = paymentService.findByTransactionNo(transactionNo);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("transactionNo", payment.getTransactionNo());
                result.put("patientRegistrationId", payment.getPatientRegistrationId());
                result.put("updatedAt", payment.getUpdatedAt());
                
                // Thêm thông tin hóa đơn nếu có
                if ("Thành công".equals(payment.getStatus())) {
                    Optional<com.example.clinic_backend.model.Invoice> invoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(payment.getPatientRegistrationId());
                    
                    if (invoiceOpt.isPresent()) {
                        com.example.clinic_backend.model.Invoice invoice = invoiceOpt.get();
                        result.put("invoiceNumber", invoice.getInvoiceNumber());
                        result.put("invoiceDate", invoice.getInvoiceDate());
                        result.put("hasInvoice", true);
                    } else {
                        result.put("hasInvoice", false);
                    }
                }
                
                System.out.println("📊 Trạng thái thanh toán: " + payment.getStatus());
                return ResponseEntity.ok(result);
            } else {
                System.out.println("⚠️ Không tìm thấy giao dịch: " + transactionNo);
                return ResponseEntity.status(404).body("Không tìm thấy giao dịch");
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi kiểm tra trạng thái thanh toán: " + e.getMessage());
            return ResponseEntity.badRequest().body("Lỗi khi kiểm tra trạng thái");
        }
    }

    @GetMapping("/payment-status/{transactionNo}")
    public ResponseEntity<Map<String, String>> getPaymentStatus(@PathVariable String transactionNo) {
        Optional<Payment> paymentOpt = paymentService.findByTransactionNo(transactionNo);
        
        Map<String, String> result = new HashMap<>();
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            result.put("status", payment.getStatus());
            result.put("amount", String.valueOf(payment.getAmount()));
            result.put("transactionNo", payment.getTransactionNo());
            result.put("createdAt", payment.getCreatedAt().toString());
            result.put("updatedAt", payment.getUpdatedAt().toString());
            
            // Thêm thông tin hóa đơn nếu có
            if ("Thành công".equals(payment.getStatus())) {
                Optional<com.example.clinic_backend.model.Invoice> invoiceOpt = 
                    invoiceService.findInvoiceByRegistrationId(payment.getPatientRegistrationId());
                
                if (invoiceOpt.isPresent()) {
                    com.example.clinic_backend.model.Invoice invoice = invoiceOpt.get();
                    result.put("invoiceNumber", invoice.getInvoiceNumber());
                    result.put("invoiceDate", invoice.getInvoiceDate().toString());
                    result.put("hasInvoice", "true");
                } else {
                    result.put("hasInvoice", "false");
                }
            }
        } else {
            result.put("status", "Không tìm thấy");
            result.put("message", "Không tìm thấy thông tin giao dịch");
        }
        
        return ResponseEntity.ok(result);
    }

    // ==================== ADMIN ENDPOINTS ====================

    @PostMapping("/manual-update-payment")
    @Transactional
    public ResponseEntity<?> manualUpdatePayment(@RequestBody Map<String, String> request) {
        try {
            String transactionNo = request.get("transactionNo");
            String status = request.get("status");
            String vnpResponseCode = request.get("vnpResponseCode");
            
            System.out.println("🔄 Cập nhật thủ công thanh toán: " + transactionNo + " -> " + status);
            
            Payment updatedPayment = paymentService.updatePaymentStatus(transactionNo, status, vnpResponseCode);
            
            // Nếu cập nhật thành công và là trạng thái "Thành công", kiểm tra và tạo hóa đơn nếu cần
            if (updatedPayment != null && "Thành công".equals(status) && updatedPayment.getPatientRegistrationId() != null) {
                try {
                    // Kiểm tra xem đã có hóa đơn chưa
                    Optional<com.example.clinic_backend.model.Invoice> existingInvoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(updatedPayment.getPatientRegistrationId());
                    
                    if (!existingInvoiceOpt.isPresent()) {
                        // Tạo hóa đơn mới
                        System.out.println("🧾 Tạo hóa đơn thủ công...");
                        com.example.clinic_backend.model.Invoice invoice = invoiceService.createInvoiceFromPayment(
                            updatedPayment.getPatientRegistrationId(),
                            transactionNo,
                            "MANUAL",
                            "Thủ công"
                        );
                        
                        if (invoice != null) {
                            System.out.println("✅ Đã tạo hóa đơn thủ công: " + invoice.getInvoiceNumber());
                        } else {
                            System.err.println("❌ Không thể tạo hóa đơn thủ công");
                        }
                    } else {
                        System.out.println("ℹ️ Đã có hóa đơn từ trước, không tạo mới");
                    }
                } catch (Exception e) {
                    System.err.println("❌ Lỗi khi tạo hóa đơn thủ công: " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok("Cập nhật thành công");
        } catch (Exception e) {
            System.err.println("❌ Lỗi cập nhật thủ công: " + e.getMessage());
            return ResponseEntity.badRequest().body("Lỗi cập nhật");
        }
    }

    // ==================== PRIVATE METHODS ====================

    private String createPaymentUrl(Map<String, String> vnp_Params) throws Exception {
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8))
                        .append('&');
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8))
                        .append('&');
            }
        }

        hashData.setLength(hashData.length() - 1);
        query.setLength(query.length() - 1);

        String vnp_SecureHash = HmacUtils.hmacSha512Hex(VNPayConfig.vnp_HashSecret, hashData.toString());
        return VNPayConfig.vnp_Url + "?" + query + "&vnp_SecureHash=" + vnp_SecureHash;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}