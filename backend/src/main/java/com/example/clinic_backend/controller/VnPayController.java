package com.example.clinic_backend.controller;

import com.example.clinic_backend.config.VNPayConfig;
import com.example.clinic_backend.model.Payment;
import com.example.clinic_backend.repository.PaymentRepository;
import com.example.clinic_backend.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.http.ResponseEntity;
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
    private final PaymentRepository paymentRepository; // THÊM: Để truy vấn trực tiếp

    // SỬA: Thêm paymentRepository vào constructor
    public VnPayController(PaymentService paymentService, PaymentRepository paymentRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
    }

    // ==================== API PUBLIC - AI CŨNG XEM ĐƯỢC ====================
    
    /**
     * API PUBLIC: Lấy trạng thái thanh toán theo registrationId
     * Ai cũng có thể gọi, không cần token
     */
    @GetMapping("/public/registrations/{registrationId}/payment-status")
    public ResponseEntity<Map<String, Object>> getPaymentStatusByRegistrationId(
            @PathVariable Long registrationId) {
        
        try {
            System.out.println("🔍 PUBLIC - Kiểm tra trạng thái thanh toán cho registration: " + registrationId);
            
            // Tìm payment theo registrationId
            Optional<Payment> paymentOpt = paymentRepository.findByPatientRegistrationId(registrationId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                
                // Trả về đầy đủ thông tin payment
                result.put("paymentStatus", payment.getStatus());
                result.put("amount", payment.getAmount());
                result.put("paymentDate", payment.getUpdatedAt());
                result.put("transactionNo", payment.getTransactionNo());
                result.put("patientRegistrationId", payment.getPatientRegistrationId());
                
                System.out.println("✅ PUBLIC - Tìm thấy payment: " + payment.getStatus() + " cho registration: " + registrationId);
            } else {
                // Nếu không tìm thấy payment, trả về trạng thái mặc định
                result.put("paymentStatus", "Chưa thanh toán");
                result.put("amount", null);
                result.put("paymentDate", null);
                result.put("transactionNo", null);
                result.put("patientRegistrationId", registrationId);
                
                System.out.println("ℹ️ PUBLIC - Không tìm thấy payment, mặc định 'Chưa thanh toán' cho registration: " + registrationId);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("❌ PUBLIC - Lỗi khi lấy trạng thái thanh toán: " + e.getMessage());
            e.printStackTrace();
            
            // Trả về kết quả mặc định ngay cả khi có lỗi
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("paymentStatus", "Chưa thanh toán");
            errorResult.put("amount", null);
            errorResult.put("paymentDate", null);
            errorResult.put("transactionNo", null);
            errorResult.put("patientRegistrationId", registrationId);
            errorResult.put("error", "Lỗi hệ thống");
            
            return ResponseEntity.ok(errorResult);
        }
    }

    // ==================== VNPAY TRANSACTION ENDPOINTS ====================

    /**
     * Tạo URL thanh toán VNPay
     */
    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> req, HttpServletRequest request) {
        try {
            System.out.println("=== 🚀 VNPAY TẠO THANH TOÁN ===");
            System.out.println("📦 Dữ liệu request: " + req);
            
            long amount = ((Number) req.get("amount")).longValue() * 100;
            String orderInfo = (String) req.get("orderInfo");
            Long patientRegistrationId = req.get("patientRegistrationId") != null ? 
                ((Number) req.get("patientRegistrationId")).longValue() : null;

            System.out.println("💰 Số tiền: " + amount + " | Thông tin đơn: " + orderInfo + " | ID Registration: " + patientRegistrationId);

            if (patientRegistrationId == null) {
                throw new Exception("patientRegistrationId là bắt buộc");
            }

            // Sinh mã giao dịch
            String vnp_TxnRef = String.valueOf(System.currentTimeMillis());
            String vnp_IpAddr = getClientIpAddress(request);

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

            // Lưu thông tin thanh toán vào database
            Payment payment = new Payment();
            payment.setPatientRegistrationId(patientRegistrationId);
            payment.setAmount((double) amount / 100);
            payment.setOrderInfo(orderInfo);
            payment.setTransactionNo(vnp_TxnRef);
            payment.setStatus("Đang chờ xử lý");
            paymentService.savePayment(payment);

            Map<String, String> result = new HashMap<>();
            result.put("paymentUrl", paymentUrl);
            result.put("transactionNo", vnp_TxnRef);
            
            System.out.println("✅ Tạo thanh toán thành công: " + vnp_TxnRef);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ Lỗi tạo thanh toán: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể tạo giao dịch: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Endpoint return URL từ VNPay sau khi thanh toán
     */
    @GetMapping("/payment-return")
    public ResponseEntity<Map<String, String>> paymentReturn(@RequestParam Map<String, String> params) {
        System.out.println("=== 🔄 VNPAY RETURN URL ===");
        System.out.println("📦 Tham số return: " + params);
        
        String vnp_ResponseCode = params.get("vnp_ResponseCode");
        String vnp_TransactionNo = params.get("vnp_TransactionNo");
        String vnp_TxnRef = params.get("vnp_TxnRef");
        String vnp_Amount = params.get("vnp_Amount");
        
        Map<String, String> result = new HashMap<>();
        
        if ("00".equals(vnp_ResponseCode)) {
            // Thanh toán thành công
            paymentService.updatePaymentStatus(vnp_TxnRef, "Thành công", vnp_ResponseCode);
            result.put("status", "success");
            result.put("message", "Thanh toán thành công!");
            result.put("amount", String.valueOf(Double.parseDouble(vnp_Amount) / 100));
            result.put("paymentStatus", "Thành công");
            System.out.println("✅ Thanh toán thành công: " + vnp_TxnRef);
        } else {
            // Thanh toán thất bại
            paymentService.updatePaymentStatus(vnp_TxnRef, "Thất bại", vnp_ResponseCode);
            result.put("status", "error");
            result.put("message", "Thanh toán thất bại! Mã lỗi: " + vnp_ResponseCode);
            result.put("paymentStatus", "Thất bại");
            System.out.println("❌ Thanh toán thất bại: " + vnp_TxnRef + " | Mã lỗi: " + vnp_ResponseCode);
        }
        
        return ResponseEntity.ok(result);
    }

    // ==================== PAYMENT STATUS ENDPOINTS ====================

    /**
     * Kiểm tra trạng thái thanh toán theo transactionNo (cần token)
     */
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
                
                System.out.println("📊 Trạng thái thanh toán: " + payment.getStatus());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(404).body("Không tìm thấy giao dịch");
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi kiểm tra trạng thái thanh toán: " + e.getMessage());
            return ResponseEntity.badRequest().body("Lỗi khi kiểm tra trạng thái");
        }
    }

    /**
     * Lấy trạng thái thanh toán theo transactionNo qua GET
     */
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
        } else {
            result.put("status", "Không tìm thấy");
            result.put("message", "Không tìm thấy thông tin giao dịch");
        }
        
        return ResponseEntity.ok(result);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Cập nhật thủ công trạng thái thanh toán (cho admin)
     */
    @PostMapping("/manual-update-payment")
    public ResponseEntity<?> manualUpdatePayment(@RequestBody Map<String, String> request) {
        try {
            String transactionNo = request.get("transactionNo");
            String status = request.get("status");
            String vnpResponseCode = request.get("vnpResponseCode");
            
            System.out.println("🔄 Cập nhật thủ công thanh toán: " + transactionNo + " -> " + status);
            
            paymentService.updatePaymentStatus(transactionNo, status, vnpResponseCode);
            
            return ResponseEntity.ok("Cập nhật thành công");
        } catch (Exception e) {
            System.err.println("❌ Lỗi cập nhật thủ công: " + e.getMessage());
            return ResponseEntity.badRequest().body("Lỗi cập nhật");
        }
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Tạo URL thanh toán VNPay
     */
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

    /**
     * Lấy địa chỉ IP của client
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}