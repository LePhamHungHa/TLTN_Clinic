package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.model.Wallet;
import com.example.clinic_backend.repository.PatientRepository;
import com.example.clinic_backend.repository.WalletRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private PatientRepository patientRepository;

    public Wallet createWalletForPatient(String email, Wallet walletData) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient not found with email: " + email));

        // kiểm tra đã có ví chưa
        if (walletRepository.findByPatientId(patient.getId()).isPresent()) {
            throw new RuntimeException("Wallet already exists for this patient");
        }

        Wallet wallet = new Wallet();
        wallet.setPatient(patient);
        wallet.setCardHolder(walletData.getCardHolder());
        wallet.setCardNumber(walletData.getCardNumber());
        wallet.setCvv(walletData.getCvv());
        wallet.setExpiry(walletData.getExpiry());
        wallet.setWalletCode("WALLET-" + UUID.randomUUID());
        wallet.setBalance(walletData.getBalance() != null ? walletData.getBalance() : BigDecimal.ZERO);

        return walletRepository.save(wallet);
    }

    public Optional<Wallet> getWalletByPatientEmail(String email) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return walletRepository.findByPatient(patient);
    }

     public String generateWalletQr(Wallet wallet) {
        try {
            String qrContent = "WALLET:" + wallet.getWalletCode();

            BitMatrix matrix = new MultiFormatWriter()
                    .encode(qrContent, BarcodeFormat.QR_CODE, 250, 250);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);

            return "data:image/png;base64," +
                    Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Error generating QR", e);
        }
    }
}
