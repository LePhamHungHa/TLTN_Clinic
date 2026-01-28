package com.example.clinic_backend.controller;

import com.example.clinic_backend.config.VNPayConfig;
import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.service.EmailService;
import com.example.clinic_backend.service.PaymentService;
import com.example.clinic_backend.service.InvoiceService;
import com.example.clinic_backend.model.Wallet;
import com.example.clinic_backend.repository.WalletRepository;
import java.math.BigDecimal;
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
    private final WalletRepository walletRepository;

    public VnPayController(PaymentService paymentService, 
                          PaymentRepository paymentRepository,
                          EmailService emailService,
                          PatientRegistrationRepository patientRegistrationRepository,
                          InvoiceService invoiceService,
                          WalletRepository walletRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
        this.patientRegistrationRepository = patientRegistrationRepository;
        this.invoiceService = invoiceService;
        this.walletRepository = walletRepository;
    }

    // API public lay trang thai thanh toan
    @GetMapping("/public/registrations/{registrationId}/payment-status")
    public ResponseEntity<?> getPaymentStatusByRegistrationId(
            @PathVariable Long registrationId) {
        
        try {
            System.out.println("Kiem tra thanh toan cho registration: " + registrationId);
            
            Optional<Payment> paymentOpt = paymentRepository.findByPatientRegistrationId(registrationId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                
                result.put("paymentStatus", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("paymentDate", payment.getUpdatedAt());
                result.put("transactionNo", payment.getTransactionNo());
                result.put("patientRegistrationId", payment.getPatientRegistrationId());
                
                // kiem tra da co hoa don chua
                if ("Thành công".equals(payment.getStatus())) {
                    Optional<com.example.clinic_backend.model.Invoice> invoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(payment.getPatientRegistrationId());
                    
                    if (invoiceOpt.isPresent()) {
                        com.example.clinic_backend.model.Invoice invoice = invoiceOpt.get();
                        result.put("invoiceNumber", invoice.getInvoiceNumber());
                        result.put("invoiceDate", invoice.getInvoiceDate());
                        result.put("hasInvoice", true);
                        System.out.println("Co hoa don: " + invoice.getInvoiceNumber());
                    } else {
                        result.put("hasInvoice", false);
                        System.out.println("Chua co hoa don");
                    }
                }
                
                System.out.println("Tim thay payment: " + payment.getStatus());
            } else {
                result.put("paymentStatus", "Chua thanh toan");
                result.put("amount", null);
                result.put("paymentDate", null);
                result.put("transactionNo", null);
                result.put("patientRegistrationId", registrationId);
                result.put("hasInvoice", false);
                
                System.out.println("Khong tim thay payment");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.out.println("Loi lay trang thai thanh toan: " + e.getMessage());
            
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("paymentStatus", "Chua thanh toan");
            errorResult.put("amount", null);
            errorResult.put("paymentDate", null);
            errorResult.put("transactionNo", null);
            errorResult.put("patientRegistrationId", registrationId);
            errorResult.put("hasInvoice", false);
            errorResult.put("error", "Loi he thong");
            
            return ResponseEntity.ok(errorResult);
        }
    }

    // tao thanh toan VNPay
    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> req, HttpServletRequest request) {
        try {
            System.out.println("Bat dau tao thanh toan VNPay");
            System.out.println("Du lieu: " + req);
            
            long amount = ((Number) req.get("amount")).longValue() * 100;
            String orderInfo = (String) req.get("orderInfo");
            Long patientRegistrationId = req.get("patientRegistrationId") != null ? 
                ((Number) req.get("patientRegistrationId")).longValue() : null;

            System.out.println("So tien: " + amount);
            System.out.println("Thong tin don: " + orderInfo);
            System.out.println("ID Registration: " + patientRegistrationId);

            if (patientRegistrationId == null) {
                return ResponseEntity.badRequest().body("Can patientRegistrationId");
            }

            // kiem tra da co thanh toan thanh cong chua
            Optional<Payment> existingPaymentOpt = paymentRepository.findByPatientRegistrationId(patientRegistrationId);
            if (existingPaymentOpt.isPresent()) {
                Payment existingPayment = existingPaymentOpt.get();
                if ("Thành công".equals(existingPayment.getStatus())) {
                    System.out.println("Da co thanh toan thanh cong cho registration nay: " + patientRegistrationId);
                    Map<String, Object> warning = new HashMap<>();
                    warning.put("warning", "Don hang da duoc thanh toan thanh cong");
                    warning.put("existingTransactionNo", existingPayment.getTransactionNo());
                    warning.put("paymentStatus", existingPayment.getStatus());
                    return ResponseEntity.ok(warning);
                }
            }

            // sinh ma giao dich
            String vnp_TxnRef = "VNPAY-" + System.currentTimeMillis() + "-" + patientRegistrationId;
            String vnp_IpAddr = getClientIpAddress(request);
            
            System.out.println("Transaction Ref: " + vnp_TxnRef);
            System.out.println("IP Address: " + vnp_IpAddr);

            // tao tham so
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

            // tao URL thanh toan
            String paymentUrl = createPaymentUrl(vnp_Params);
            System.out.println("Payment URL: " + paymentUrl);

            // luu thong tin thanh toan
            Payment payment = new Payment();
            payment.setPatientRegistrationId(patientRegistrationId);
            payment.setAmount((double) amount / 100);
            payment.setOrderInfo(orderInfo);
            payment.setTransactionNo(vnp_TxnRef);
            payment.setStatus("Đang chờ xử lý");
            
            Payment savedPayment = paymentService.savePayment(payment);
            System.out.println("Da luu payment ID: " + savedPayment.getId());

            Map<String, String> result = new HashMap<>();
            result.put("paymentUrl", paymentUrl);
            result.put("transactionNo", vnp_TxnRef);
            
            System.out.println("Tao thanh toan thanh cong!");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.out.println("Loi tao thanh toan: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Khong the tao giao dich: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // tao thanh toan nap vi
    @PostMapping("/create-wallet-payment")
    public ResponseEntity<?> createWalletPayment(@RequestBody Map<String, Object> req, HttpServletRequest request) {
        try {
            System.out.println("Tao thanh toan VNPay (nap vi)");
            System.out.println("Du lieu: " + req);

            long amount = ((Number) req.get("amount")).longValue() * 100;
            Long walletId = req.get("walletId") != null ? ((Number) req.get("walletId")).longValue() : null;
            String orderInfo = "WALLET_DEPOSIT:" + walletId;

            if (walletId == null) {
                return ResponseEntity.badRequest().body("Can walletId");
            }

            // sinh ma giao dich
            String vnp_TxnRef = "VNPAY-WALLET-" + System.currentTimeMillis() + "-" + walletId;
            String vnp_IpAddr = getClientIpAddress(request);

            // tao tham so
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

            // tao URL thanh toan
            String paymentUrl = createPaymentUrl(vnp_Params);
            System.out.println("Payment URL (wallet): " + paymentUrl);

            // luu thong tin thanh toan
            Payment payment = new Payment();
            payment.setPatientRegistrationId(null);
            payment.setAmount((double) amount / 100);
            payment.setOrderInfo(orderInfo);
            payment.setTransactionNo(vnp_TxnRef);
            payment.setStatus("Đang chờ xử lý");

            Payment savedPayment = paymentService.savePayment(payment);
            System.out.println("Da luu payment (wallet) ID: " + savedPayment.getId());

            Map<String, String> result = new HashMap<>();
            result.put("paymentUrl", paymentUrl);
            result.put("transactionNo", vnp_TxnRef);

            System.out.println("Tao thanh toan vi thanh cong!");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.out.println("Loi tao thanh toan vi: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Khong the tao giao dich vi: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // endpoint tra ve tu VNPay
    @GetMapping("/payment-return")
    @Transactional
    public ResponseEntity<Map<String, String>> paymentReturn(@RequestParam Map<String, String> params) {
        System.out.println("VNPAY RETURN URL");
        System.out.println("Tham so tu VNPay: " + params);
        
        String vnp_ResponseCode = params.get("vnp_ResponseCode");
        String vnp_TransactionNo = params.get("vnp_TransactionNo");
        String vnp_TxnRef = params.get("vnp_TxnRef");
        String vnp_Amount = params.get("vnp_Amount");
        String vnp_BankCode = params.get("vnp_BankCode");
        String vnp_PayDate = params.get("vnp_PayDate");
        String vnp_BankTranNo = params.get("vnp_BankTranNo");
        
        System.out.println("Thong tin giao dich:");
        System.out.println("Response Code: " + vnp_ResponseCode);
        System.out.println("Transaction No (VNPay): " + vnp_TransactionNo);
        System.out.println("TxnRef (cua chung ta): " + vnp_TxnRef);
        System.out.println("Amount: " + vnp_Amount);
        System.out.println("Bank Code: " + vnp_BankCode);
        
        Map<String, String> result = new HashMap<>();
        
        if ("00".equals(vnp_ResponseCode)) {
            System.out.println("Thanh toan thanh cong!");
            
            try {
                // 1. kiem tra payment da xu ly chua
                System.out.println("Kiem tra payment voi TxnRef: " + vnp_TxnRef);
                Optional<Payment> paymentCheckOpt = paymentService.findByTransactionNo(vnp_TxnRef);
                
                if (!paymentCheckOpt.isPresent()) {
                    System.out.println("Khong tim thay payment voi TxnRef: " + vnp_TxnRef);
                    result.put("status", "error");
                    result.put("message", "Khong tim thay thong tin giao dich");
                    return ResponseEntity.ok(result);
                }
                
                Payment existingPayment = paymentCheckOpt.get();
                System.out.println("Payment hien tai:");
                System.out.println("ID: " + existingPayment.getId());
                System.out.println("Status: " + existingPayment.getStatus());
                System.out.println("Registration ID: " + existingPayment.getPatientRegistrationId());
                
                // neu da xu ly thanh cong roi
                if ("Thành công".equals(existingPayment.getStatus())) {
                    System.out.println("Payment da duoc xu ly thanh cong truoc do");
                    
                    // kiem tra hoa don
                    Optional<com.example.clinic_backend.model.Invoice> existingInvoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(existingPayment.getPatientRegistrationId());
                    
                    result.put("status", "success");
                    result.put("message", "Thanh toan da duoc xu ly thanh cong");
                    result.put("amount", String.valueOf(existingPayment.getAmount()));
                    result.put("paymentStatus", "Thành công");
                    result.put("transactionNo", vnp_TransactionNo);
                    
                    if (existingInvoiceOpt.isPresent()) {
                        result.put("invoiceNumber", existingInvoiceOpt.get().getInvoiceNumber());
                        result.put("invoiceDate", existingInvoiceOpt.get().getInvoiceDate().toString());
                        System.out.println("Da co hoa don: " + existingInvoiceOpt.get().getInvoiceNumber());
                    } else {
                        System.out.println("Chua co hoa don");
                    }
                    
                    return ResponseEntity.ok(result);
                }
                
                // 2. cap nhat trang thai thanh toan
                System.out.println("Cap nhat trang thai payment...");
                Payment updatedPayment = paymentService.updatePaymentStatus(vnp_TxnRef, "Thành công", vnp_ResponseCode);
                
                if (updatedPayment == null) {
                    System.out.println("Khong the cap nhat payment");
                    return ResponseEntity.badRequest().body(Map.of("error", "Khong the cap nhat payment"));
                }
                
                System.out.println("Da cap nhat payment thanh cong");
                System.out.println("Payment sau khi cap nhat:");
                System.out.println("Registration ID: " + updatedPayment.getPatientRegistrationId());
                System.out.println("Status: " + updatedPayment.getStatus());
                
                // 3. cap nhat PatientRegistration hoac Wallet
                if (updatedPayment.getPatientRegistrationId() != null) {
                    System.out.println("Tim PatientRegistration voi ID: " + updatedPayment.getPatientRegistrationId());
                    Optional<PatientRegistration> registrationOpt = patientRegistrationRepository
                        .findById(updatedPayment.getPatientRegistrationId());
                    
                    if (registrationOpt.isPresent()) {
                        PatientRegistration registration = registrationOpt.get();
                        
                        System.out.println("Tim thay PatientRegistration:");
                        System.out.println("Ten: " + registration.getFullName());
                        System.out.println("Email: " + registration.getEmail());
                        
                        // chi cap nhat neu chua PAID
                        if (!"PAID".equals(registration.getPaymentStatus())) {
                            System.out.println("Cap nhat PatientRegistration...");
                            
                            double amountInVND = Double.parseDouble(vnp_Amount) / 100;
                            
                            registration.setPaymentStatus("PAID");
                            registration.setTransactionNumber(vnp_TransactionNo);
                            registration.setPaidAmount(java.math.BigDecimal.valueOf(amountInVND));
                            registration.setPaidAt(LocalDateTime.now());
                            
                            PatientRegistration savedRegistration = patientRegistrationRepository.save(registration);
                            System.out.println("Da cap nhat PatientRegistration:");
                            System.out.println("So tien: " + amountInVND);
                            System.out.println("Thoi gian: " + registration.getPaidAt());
                            
                            // 4. gui email thong bao
                            try {
                                System.out.println("Dang gui email thong bao...");
                                emailService.sendPaymentSuccessEmail(savedRegistration);
                                System.out.println("Da gui email cho: " + savedRegistration.getEmail());
                            } catch (Exception emailException) {
                                System.out.println("Loi gui email: " + emailException.getMessage());
                            }
                            
                            // 5. tao hoa don
                            System.out.println("Bat dau tao hoa don...");
                            System.out.println("Thong tin tao hoa don:");
                            System.out.println("Registration ID: " + updatedPayment.getPatientRegistrationId());
                            System.out.println("Transaction No: " + vnp_TxnRef);
                            
                            try {
                                // kiem tra truoc da co hoa don chua
                                Optional<com.example.clinic_backend.model.Invoice> existingInvoiceCheck = 
                                    invoiceService.findInvoiceByRegistrationId(updatedPayment.getPatientRegistrationId());
                                
                                if (existingInvoiceCheck.isPresent()) {
                                    System.out.println("Da co hoa don cho registration nay");
                                    com.example.clinic_backend.model.Invoice existingInvoice = existingInvoiceCheck.get();
                                    result.put("invoiceNumber", existingInvoice.getInvoiceNumber());
                                    result.put("invoiceDate", existingInvoice.getInvoiceDate().toString());
                                    System.out.println("So hoa don da co: " + existingInvoice.getInvoiceNumber());
                                } else {
                                    // tao hoa don moi
                                    com.example.clinic_backend.model.Invoice invoice = invoiceService.createInvoiceFromPayment(
                                        updatedPayment.getPatientRegistrationId(),
                                        vnp_TxnRef,
                                        vnp_BankCode,
                                        "VNPay"
                                    );
                                    
                                    if (invoice != null) {
                                        result.put("invoiceNumber", invoice.getInvoiceNumber());
                                        result.put("invoiceDate", invoice.getInvoiceDate().toString());
                                        System.out.println("Da tao hoa don thanh cong!");
                                        System.out.println("So hoa don: " + invoice.getInvoiceNumber());
                                    } else {
                                        System.out.println("InvoiceService tra ve null!");
                                        result.put("invoiceError", "Khong the tao hoa don");
                                    }
                                }
                            } catch (Exception invoiceException) {
                                System.out.println("Loi khi tao hoa don: " + invoiceException.getMessage());
                                result.put("invoiceError", "Loi khi tao hoa don");
                            }
                        } else {
                            System.out.println("Registration da duoc thanh toan tu truoc");
                        }
                    } else {
                        System.out.println("Khong tim thay PatientRegistration");
                    }
                } else {
                    // co the la giao dich nap tien vao vi
                    String orderInfoStr = updatedPayment.getOrderInfo();
                    if (orderInfoStr != null && orderInfoStr.startsWith("WALLET_DEPOSIT:")) {
                        try {
                            String[] parts = orderInfoStr.split(":");
                            Long walletId = Long.parseLong(parts[1]);
                            System.out.println("Day la giao dich nap tien vi, walletId=" + walletId);

                            Optional<Wallet> walletOpt = walletRepository.findById(walletId);
                            if (walletOpt.isPresent()) {
                                Wallet wallet = walletOpt.get();
                                BigDecimal current = wallet.getBalance() == null ? BigDecimal.ZERO : wallet.getBalance();
                                BigDecimal added = BigDecimal.valueOf(Double.parseDouble(vnp_Amount) / 100.0);
                                wallet.setBalance(current.add(added));
                                walletRepository.save(wallet);
                                System.out.println("Da cap nhat so du vi: " + wallet.getBalance());
                                result.put("walletBalance", wallet.getBalance().toString());
                            } else {
                                System.out.println("Khong tim thay vi: " + walletId);
                            }
                        } catch (Exception we) {
                            System.out.println("Loi khi cap nhat vi: " + we.getMessage());
                        }
                    } else {
                        System.out.println("Payment khong co patientRegistrationId");
                    }
                }
                
            } catch (Exception e) {
                System.out.println("Loi khi xu ly thanh toan thanh cong: " + e.getMessage());
            }
            
            result.put("status", "success");
            result.put("message", "Thanh toan thanh cong!");
            result.put("amount", String.valueOf(Double.parseDouble(vnp_Amount) / 100));
            result.put("paymentStatus", "Thành công");
            result.put("transactionNo", vnp_TransactionNo);
            result.put("bankCode", vnp_BankCode);
            
            System.out.println("Xu ly thanh toan hoan tat!");
            
        } else {
            // thanh toan that bai
            System.out.println("Thanh toan that bai! Ma loi: " + vnp_ResponseCode);
            
            try {
                paymentService.updatePaymentStatus(vnp_TxnRef, "Thất bại", vnp_ResponseCode);
                System.out.println("Da cap nhat trang thai payment thanh 'That bai'");
            } catch (Exception e) {
                System.out.println("Khong the cap nhat trang thai payment that bai: " + e.getMessage());
            }
            
            result.put("status", "error");
            result.put("message", "Thanh toan that bai! Ma loi: " + vnp_ResponseCode);
            result.put("paymentStatus", "Thất bại");
        }
        
        System.out.println("Ket qua tra ve: " + result);
        return ResponseEntity.ok(result);
    }

    // kiem tra trang thai thanh toan
    @PostMapping("/check-payment-status")
    public ResponseEntity<?> checkPaymentStatus(@RequestBody Map<String, String> request) {
        try {
            String transactionNo = request.get("transactionNo");
            System.out.println("Kiem tra trang thai thanh toan: " + transactionNo);
            
            Optional<Payment> paymentOpt = paymentService.findByTransactionNo(transactionNo);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                
                Map<String, Object> result = new HashMap<>();
                result.put("status", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("transactionNo", payment.getTransactionNo());
                result.put("patientRegistrationId", payment.getPatientRegistrationId());
                result.put("updatedAt", payment.getUpdatedAt());
                
                // them thong tin hoa don neu co
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
                
                System.out.println("Trang thai thanh toan: " + payment.getStatus());
                return ResponseEntity.ok(result);
            } else {
                System.out.println("Khong tim thay giao dich: " + transactionNo);
                return ResponseEntity.status(404).body("Khong tim thay giao dich");
            }
        } catch (Exception e) {
            System.out.println("Loi kiem tra trang thai thanh toan: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi khi kiem tra trang thai");
        }
    }

    // lay trang thai thanh toan
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
            
            // them thong tin hoa don neu co
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
            result.put("status", "Khong tim thay");
            result.put("message", "Khong tim thay thong tin giao dich");
        }
        
        return ResponseEntity.ok(result);
    }

    // admin cap nhat thu cong
    @PostMapping("/manual-update-payment")
    @Transactional
    public ResponseEntity<?> manualUpdatePayment(@RequestBody Map<String, String> request) {
        try {
            String transactionNo = request.get("transactionNo");
            String status = request.get("status");
            String vnpResponseCode = request.get("vnpResponseCode");
            
            System.out.println("Cap nhat thu cong thanh toan: " + transactionNo + " -> " + status);
            
            Payment updatedPayment = paymentService.updatePaymentStatus(transactionNo, status, vnpResponseCode);
            
            // neu cap nhat thanh cong va la trang thai "Thành công", kiem tra va tao hoa don
            if (updatedPayment != null && "Thành công".equals(status) && updatedPayment.getPatientRegistrationId() != null) {
                try {
                    // kiem tra xem da co hoa don chua
                    Optional<com.example.clinic_backend.model.Invoice> existingInvoiceOpt = 
                        invoiceService.findInvoiceByRegistrationId(updatedPayment.getPatientRegistrationId());
                    
                    if (!existingInvoiceOpt.isPresent()) {
                        // tao hoa don moi
                        System.out.println("Tao hoa don thu cong...");
                        com.example.clinic_backend.model.Invoice invoice = invoiceService.createInvoiceFromPayment(
                            updatedPayment.getPatientRegistrationId(),
                            transactionNo,
                            "MANUAL",
                            "Thu cong"
                        );
                        
                        if (invoice != null) {
                            System.out.println("Da tao hoa don thu cong: " + invoice.getInvoiceNumber());
                        } else {
                            System.out.println("Khong the tao hoa don thu cong");
                        }
                    } else {
                        System.out.println("Da co hoa don tu truoc, khong tao moi");
                    }
                } catch (Exception e) {
                    System.out.println("Loi khi tao hoa don thu cong: " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok("Cap nhat thanh cong");
        } catch (Exception e) {
            System.out.println("Loi cap nhat thu cong: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi cap nhat");
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