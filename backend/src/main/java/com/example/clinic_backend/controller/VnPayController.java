package com.example.clinic_backend.controller;

import com.example.clinic_backend.config.VNPayConfig;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/vnpay")
public class VnPayController {

    @PostMapping("/create-payment")
    public Map<String, String> createPayment(@RequestBody Map<String, Object> req, HttpServletRequest request) throws Exception {
        // Lấy thông tin từ request
        long amount = ((Number) req.get("amount")).longValue() * 100;
        String orderInfo = (String) req.get("orderInfo");

        // Sinh mã giao dịch ngẫu nhiên
        String vnp_TxnRef = String.valueOf(System.currentTimeMillis());
        String vnp_IpAddr = request.getRemoteAddr();

        // Lấy cấu hình từ VNPayConfig
        String vnp_TmnCode = VNPayConfig.vnp_TmnCode;

        // Tạo map tham số gửi đến VNPAY
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", "billpayment");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        // Ngày tạo giao dịch
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String createDate = formatter.format(cal.getTime());
        vnp_Params.put("vnp_CreateDate", createDate);

        // Sắp xếp các field theo thứ tự A-Z
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

        // Xóa ký tự & cuối cùng
        hashData.setLength(hashData.length() - 1);
        query.setLength(query.length() - 1);

        // Tạo secure hash (chữ ký số)
        String vnp_SecureHash = HmacUtils.hmacSha512Hex(VNPayConfig.vnp_HashSecret, hashData.toString());
        String paymentUrl = VNPayConfig.vnp_Url + "?" + query + "&vnp_SecureHash=" + vnp_SecureHash;

        // Trả về link thanh toán cho frontend
        Map<String, String> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);
        return result;
    }

    // Khi người dùng thanh toán xong, VNPAY sẽ redirect về đây
    @GetMapping("/payment-return")
    public String paymentReturn(@RequestParam Map<String, String> params) {
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            return "Thanh toán thành công!";
        } else {
            return "Thanh toán thất bại!";
        }
    }
}
