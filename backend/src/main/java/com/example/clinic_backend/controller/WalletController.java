package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Wallet;
import com.example.clinic_backend.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallets")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('ROLE_PATIENT')")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @PostMapping("/create")
    public ResponseEntity<?> createWallet(@RequestBody Wallet wallet, Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Tao vi cho email: " + email);
            
            Wallet newWallet = walletService.createWalletForPatient(email, wallet);
            return ResponseEntity.ok(newWallet);
        } catch (Exception e) {
            System.out.println("Loi tao vi: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi tao vi: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyWallet(Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Lay vi cho email: " + email);
            
            Wallet wallet = walletService.getWalletByPatientEmail(email)
                .orElseThrow(() -> new RuntimeException("Khong tim thay vi"));
            
            return ResponseEntity.ok(wallet);
        } catch (RuntimeException e) {
            System.out.println("Loi lay vi: " + e.getMessage());
            return ResponseEntity.status(404).body("Khong tim thay vi");
        } catch (Exception e) {
            System.out.println("Loi server: " + e.getMessage());
            return ResponseEntity.status(500).body("Loi server");
        }
    }

    @GetMapping("/qr")
    public ResponseEntity<?> getWalletQr(Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Tao QR cho vi cua email: " + email);
            
            Wallet wallet = walletService.getWalletByPatientEmail(email)
                .orElseThrow(() -> new RuntimeException("Khong tim thay vi"));
            
            String qrBase64 = walletService.generateWalletQr(wallet);
            
            if (qrBase64 == null || qrBase64.isEmpty()) {
                return ResponseEntity.badRequest().body("Khong the tao QR");
            }
            
            return ResponseEntity.ok(qrBase64);
        } catch (RuntimeException e) {
            System.out.println("Loi tao QR: " + e.getMessage());
            return ResponseEntity.status(404).body("Khong tim thay vi");
        } catch (Exception e) {
            System.out.println("Loi server khi tao QR: " + e.getMessage());
            return ResponseEntity.status(500).body("Loi server");
        }
    }

    // them API test don gian
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        System.out.println("Test wallet API");
        return ResponseEntity.ok("Wallet API dang hoat dong");
    }
}