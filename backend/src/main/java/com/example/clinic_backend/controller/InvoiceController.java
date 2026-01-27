package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Invoice;
import com.example.clinic_backend.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {
    
    @Autowired
    private InvoiceService invoiceService;
    
    // Lấy hóa đơn theo số hóa đơn
    @GetMapping("/{invoiceNumber}")
    public ResponseEntity<?> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        try {
            System.out.println("Đang lấy hóa đơn: " + invoiceNumber);
            
            return invoiceService.getInvoiceByNumber(invoiceNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
                
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy hóa đơn: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy thông tin hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy hóa đơn theo transaction number
    @GetMapping("/transaction/{transactionNo}")
    public ResponseEntity<?> getInvoiceByTransactionNo(@PathVariable String transactionNo) {
        try {
            System.out.println("Đang lấy hóa đơn theo transaction: " + transactionNo);
            
            return invoiceService.getInvoiceByTransactionNo(transactionNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
                
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy hóa đơn theo transaction: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy thông tin hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy hóa đơn theo patient registration ID
    @GetMapping("/registration/{patientRegistrationId}")
    public ResponseEntity<?> getInvoicesByRegistrationId(@PathVariable Long patientRegistrationId) {
        try {
            System.out.println("Đang lấy hóa đơn cho registration: " + patientRegistrationId);
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientRegistrationId(patientRegistrationId);
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy hóa đơn: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy danh sách hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy hóa đơn theo email hoặc số điện thoại bệnh nhân - API PUBLIC
    @GetMapping("/public/patient")
    public ResponseEntity<?> getInvoicesByPatientPublic(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        try {
            System.out.println("PUBLIC - Đang lấy hóa đơn cho bệnh nhân - Email: " + email + ", Phone: " + phone);
            
            if ((email == null || email.isEmpty()) && (phone == null || phone.isEmpty())) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Cần cung cấp email hoặc số điện thoại");
                return ResponseEntity.badRequest().body(error);
            }
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientEmailOrPhone(email, phone);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", invoices.size());
            response.put("invoices", invoices);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("PUBLIC - Lỗi khi lấy hóa đơn bệnh nhân: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể lấy danh sách hóa đơn: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy hóa đơn theo email hoặc số điện thoại bệnh nhân - API có auth
    @GetMapping("/patient")
    public ResponseEntity<?> getInvoicesByPatient(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        try {
            System.out.println("Đang lấy hóa đơn cho bệnh nhân - Email: " + email + ", Phone: " + phone);
            
            if ((email == null || email.isEmpty()) && (phone == null || phone.isEmpty())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cần cung cấp email hoặc số điện thoại");
                return ResponseEntity.badRequest().body(error);
            }
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientEmailOrPhone(email, phone);
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy hóa đơn bệnh nhân: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy danh sách hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy tất cả hóa đơn (cho admin) - SỬA LẠI ĐỂ PHÙ HỢP VỚI FRONTEND
    @GetMapping("/all")
    public ResponseEntity<?> getAllInvoices() {
        try {
            System.out.println("Đang lấy tất cả hóa đơn");
            
            List<Invoice> invoices = invoiceService.getAllInvoices();
            
            // Trả về dưới dạng array để tương thích với frontend
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy tất cả hóa đơn: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy danh sách hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API mới: Lấy tất cả hóa đơn với định dạng response chuẩn
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllInvoicesForAdmin() {
        try {
            System.out.println("ADMIN - Đang lấy tất cả hóa đơn");
            
            List<Invoice> invoices = invoiceService.getAllInvoices();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", invoices.size());
            response.put("invoices", invoices);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("ADMIN - Lỗi khi lấy hóa đơn: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể lấy danh sách hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API để lấy hóa đơn theo trạng thái
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getInvoicesByStatus(@PathVariable String status) {
        try {
            System.out.println("Đang lấy hóa đơn theo trạng thái: " + status);
            
            List<Invoice> invoices = invoiceService.getInvoicesByStatus(status);
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy hóa đơn theo trạng thái: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy danh sách hóa đơn theo trạng thái");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API để cập nhật trạng thái hóa đơn
    @PutMapping("/{invoiceNumber}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateInvoiceStatus(
            @PathVariable String invoiceNumber,
            @RequestBody Map<String, String> request) {
        try {
            System.out.println("Đang cập nhật trạng thái hóa đơn: " + invoiceNumber);
            
            String status = request.get("status");
            if (status == null || status.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Trạng thái không được để trống");
                return ResponseEntity.badRequest().body(error);
            }
            
            Invoice updatedInvoice = invoiceService.updateInvoiceStatus(invoiceNumber, status);
            if (updatedInvoice != null) {
                return ResponseEntity.ok(updatedInvoice);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Không tìm thấy hóa đơn");
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            System.err.println("Lỗi khi cập nhật trạng thái hóa đơn: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể cập nhật trạng thái hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API để xóa hóa đơn
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id) {
        try {
            System.out.println("Đang xóa hóa đơn: " + id);
            
            invoiceService.deleteInvoice(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa hóa đơn thành công");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa hóa đơn: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể xóa hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API PUBLIC để bệnh nhân xem hóa đơn của mình (giữ lại cho tương thích)
    @GetMapping("/public/patient-invoices")
    public ResponseEntity<?> getPatientInvoicesPublic(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        try {
            System.out.println("PUBLIC (cũ) - Đang lấy hóa đơn cho bệnh nhân: " + email + " | " + phone);
            
            if ((email == null || email.isEmpty()) && (phone == null || phone.isEmpty())) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Cần cung cấp email hoặc số điện thoại");
                return ResponseEntity.badRequest().body(error);
            }
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientEmailOrPhone(email, phone);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", invoices.size());
            response.put("invoices", invoices);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("PUBLIC (cũ) - Lỗi khi lấy hóa đơn bệnh nhân: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể lấy thông tin hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API PUBLIC mới: Lấy hóa đơn theo email (phone optional)
    @GetMapping("/public/by-email")
    public ResponseEntity<?> getInvoicesByEmailPublic(@RequestParam String email) {
        try {
            System.out.println("PUBLIC - Đang lấy hóa đơn theo email: " + email);
            
            if (email == null || email.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "Email là bắt buộc");
                return ResponseEntity.badRequest().body(error);
            }
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientEmailOrPhone(email, null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", invoices.size());
            response.put("invoices", invoices);
            response.put("email", email);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("PUBLIC - Lỗi khi lấy hóa đơn theo email: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể lấy thông tin hóa đơn: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API thống kê hóa đơn
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getInvoiceStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            System.out.println("Đang lấy thống kê hóa đơn từ " + startDate + " đến " + endDate);
            
            // Thực hiện logic thống kê ở đây
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("success", true);
            statistics.put("message", "API thống kê đang được phát triển");
            
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy thống kê: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể lấy thống kê hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
}