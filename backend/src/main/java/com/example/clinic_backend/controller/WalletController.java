package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Wallet;
import com.example.clinic_backend.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallets")
@CrossOrigin(origins = "*")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @PostMapping("/create")
    public ResponseEntity<Wallet> createWallet(@RequestBody Wallet wallet, Authentication authentication) {
        String email = authentication.getName(); // lấy từ JWT
        Wallet newWallet = walletService.createWalletForPatient(email, wallet);
        return ResponseEntity.ok(newWallet);
    }

    @GetMapping("/me")
    public Wallet getMyWallet(Authentication authentication) {
        String email = authentication.getName();
        return walletService.getWalletByPatientEmail(email)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    @GetMapping("/qr")
    public ResponseEntity<String> getWalletQr(Authentication authentication) {
        String email = authentication.getName();
        Wallet wallet = walletService.getWalletByPatientEmail(email)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        String qrBase64 = walletService.generateWalletQr(wallet);
        return ResponseEntity.ok(qrBase64);
    }
}
