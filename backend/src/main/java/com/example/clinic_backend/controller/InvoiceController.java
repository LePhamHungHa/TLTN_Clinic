package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Invoice;
import com.example.clinic_backend.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
            System.out.println("🔍 Getting invoice: " + invoiceNumber);
            
            return invoiceService.getInvoiceByNumber(invoiceNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
                
        } catch (Exception e) {
            System.err.println("❌ Error getting invoice: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy thông tin hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy hóa đơn theo transaction number
    @GetMapping("/transaction/{transactionNo}")
    public ResponseEntity<?> getInvoiceByTransactionNo(@PathVariable String transactionNo) {
        try {
            System.out.println("🔍 Getting invoice by transaction: " + transactionNo);
            
            return invoiceService.getInvoiceByTransactionNo(transactionNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
                
        } catch (Exception e) {
            System.err.println("❌ Error getting invoice by transaction: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy thông tin hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy hóa đơn theo patient registration ID
    @GetMapping("/registration/{patientRegistrationId}")
    public ResponseEntity<?> getInvoicesByRegistrationId(@PathVariable Long patientRegistrationId) {
        try {
            System.out.println("🔍 Getting invoices for registration: " + patientRegistrationId);
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientRegistrationId(patientRegistrationId);
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting invoices: " + e.getMessage());
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
            System.out.println("🔍 PUBLIC - Getting invoices for patient - Email: " + email + ", Phone: " + phone);
            
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
            System.err.println("❌ PUBLIC - Error getting patient invoices: " + e.getMessage());
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
            System.out.println("🔍 Getting invoices for patient - Email: " + email + ", Phone: " + phone);
            
            if ((email == null || email.isEmpty()) && (phone == null || phone.isEmpty())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cần cung cấp email hoặc số điện thoại");
                return ResponseEntity.badRequest().body(error);
            }
            
            List<Invoice> invoices = invoiceService.getInvoicesByPatientEmailOrPhone(email, phone);
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting patient invoices: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy danh sách hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Lấy tất cả hóa đơn (cho admin)
    @GetMapping("/all")
    public ResponseEntity<?> getAllInvoices() {
        try {
            System.out.println("📋 Getting all invoices");
            
            List<Invoice> invoices = invoiceService.getAllInvoices();
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting all invoices: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy danh sách hóa đơn");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // API PUBLIC để bệnh nhân xem hóa đơn của mình (giữ lại cho tương thích)
    @GetMapping("/public/patient-invoices")
    public ResponseEntity<?> getPatientInvoicesPublic(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        try {
            System.out.println("🔍 PUBLIC (old) - Getting invoices for patient: " + email + " | " + phone);
            
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
            System.err.println("❌ PUBLIC (old) - Error getting patient invoices: " + e.getMessage());
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
            System.out.println("🔍 PUBLIC - Getting invoices by email: " + email);
            
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
            System.err.println("❌ PUBLIC - Error getting invoices by email: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Không thể lấy thông tin hóa đơn: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}