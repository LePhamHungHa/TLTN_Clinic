package com.example.clinic_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_registration_id")
    private Long patientRegistrationId;

    private Double amount;
    private String orderInfo;

    @Column(name = "transaction_no")
    private String transactionNo;

    @Column(name = "bank_code")
    private String bankCode;

    private String status = "Đang chờ xử lý";

    @Column(name = "vnp_response_code")
    private String vnpResponseCode;

    @Column(name = "vnp_transaction_no")
    private String vnpTransactionNo;

    @Column(name = "vnp_bank_code")
    private String vnpBankCode;

    @Column(name = "vnp_bank_tran_no")
    private String vnpBankTranNo;

    @Column(name = "vnp_card_type")
    private String vnpCardType;

    @Column(name = "vnp_pay_date")
    private String vnpPayDate;

    @Column(name = "vnp_secure_hash")
    private String vnpSecureHash;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public Payment() {}

    public Payment(Long patientRegistrationId, Double amount, String orderInfo, 
                   String transactionNo, String status) {
        this.patientRegistrationId = patientRegistrationId;
        this.amount = amount;
        this.orderInfo = orderInfo;
        this.transactionNo = transactionNo;
        this.status = status;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // PrePersist và PreUpdate
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ======== GETTERS & SETTERS =========
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientRegistrationId() { return patientRegistrationId; }
    public void setPatientRegistrationId(Long patientRegistrationId) { this.patientRegistrationId = patientRegistrationId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getOrderInfo() { return orderInfo; }
    public void setOrderInfo(String orderInfo) { this.orderInfo = orderInfo; }

    public String getTransactionNo() { return transactionNo; }
    public void setTransactionNo(String transactionNo) { this.transactionNo = transactionNo; }

    public String getBankCode() { return bankCode; }
    public void setBankCode(String bankCode) { this.bankCode = bankCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVnpResponseCode() { return vnpResponseCode; }
    public void setVnpResponseCode(String vnpResponseCode) { this.vnpResponseCode = vnpResponseCode; }

    public String getVnpTransactionNo() { return vnpTransactionNo; }
    public void setVnpTransactionNo(String vnpTransactionNo) { this.vnpTransactionNo = vnpTransactionNo; }

    public String getVnpBankCode() { return vnpBankCode; }
    public void setVnpBankCode(String vnpBankCode) { this.vnpBankCode = vnpBankCode; }

    public String getVnpBankTranNo() { return vnpBankTranNo; }
    public void setVnpBankTranNo(String vnpBankTranNo) { this.vnpBankTranNo = vnpBankTranNo; }

    public String getVnpCardType() { return vnpCardType; }
    public void setVnpCardType(String vnpCardType) { this.vnpCardType = vnpCardType; }

    public String getVnpPayDate() { return vnpPayDate; }
    public void setVnpPayDate(String vnpPayDate) { this.vnpPayDate = vnpPayDate; }

    public String getVnpSecureHash() { return vnpSecureHash; }
    public void setVnpSecureHash(String vnpSecureHash) { this.vnpSecureHash = vnpSecureHash; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // toString method for debugging
    @Override
    public String toString() {
        return "Payment{" +
                "id=" + id +
                ", patientRegistrationId=" + patientRegistrationId +
                ", amount=" + amount +
                ", orderInfo='" + orderInfo + '\'' +
                ", transactionNo='" + transactionNo + '\'' +
                ", status='" + status + '\'' +
                ", vnpResponseCode='" + vnpResponseCode + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}