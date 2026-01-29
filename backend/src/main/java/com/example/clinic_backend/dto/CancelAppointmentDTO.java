package com.example.clinic_backend.dto;

import java.math.BigDecimal;

public class CancelAppointmentDTO {
    private Long appointmentId;
    private String reason;
    private boolean requestRefund;
    private String refundAccountInfo;
    private String bankAccountNumber;
    private String bankName;
    private String accountHolderName;
    private String refundQRCodeImage;
    private Long userId; 
    private String userEmail;
    
    // Getter và Setter
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public boolean isRequestRefund() { return requestRefund; }
    public void setRequestRefund(boolean requestRefund) { this.requestRefund = requestRefund; }
    
    public String getRefundAccountInfo() { return refundAccountInfo; }
    public void setRefundAccountInfo(String refundAccountInfo) { this.refundAccountInfo = refundAccountInfo; }
    
    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    
    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }
    
    public String getRefundQRCodeImage() { return refundQRCodeImage; }
    public void setRefundQRCodeImage(String refundQRCodeImage) { this.refundQRCodeImage = refundQRCodeImage; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    // Getter và Setter cho userEmail
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    @Override
    public String toString() {
        return "CancelAppointmentDTO{" +
                "appointmentId=" + appointmentId +
                ", reason='" + reason + '\'' +
                ", requestRefund=" + requestRefund +
                ", userId=" + userId +
                ", userEmail='" + userEmail + '\'' +
                '}';
    }
}