package com.example.clinic_backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private Double amount;
    private String orderInfo;
    private String transactionNo;
    private String bankCode;
    private String status;
    private LocalDateTime payDate = LocalDateTime.now();
}
