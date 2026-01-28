package com.example.clinic_backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "patient_registrations")
public class PatientRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Doctor doctor;

    @Column(name = "registration_number")
    private String registrationNumber;
    
    @Column(name = "transaction_number")
    private String transactionNumber;
    
    @Column(name = "room_number")
    private String roomNumber;
    
    @Column(name = "queue_number")
    private Integer queueNumber;
    
    @Column(name = "expected_time_slot")
    private String expectedTimeSlot;
    
    @Column(name = "examination_fee")
    private BigDecimal examinationFee;
    
    @Column(name = "insurance_type")
    private String insuranceType;
    
    @Column(name = "patient_code")
    private String patientCode;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "approved_by")
    private Long approvedBy;
    
    @Column(name = "auto_approved")
    private Boolean autoApproved = false;
    
    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "assigned_session")
    private String assignedSession;

    @Column(name = "examination_status")
    private String examinationStatus = "WAITING";

    @Column(name = "payment_status")
    private String paymentStatus;
    
    @Column(name = "paid_amount")
    private BigDecimal paidAmount;
    
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;
    
    @Column(name = "last_reminder_sent_at")
    private LocalDateTime lastReminderSentAt;

    // constructors
    public PatientRegistration() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
        this.examinationStatus = "WAITING";
        this.reminderSent = false;
    }

    public PatientRegistration(String fullName, LocalDate dob, String gender, String phone, 
                             String email, String address, String department, 
                             LocalDate appointmentDate) {
        this();
        this.fullName = fullName;
        this.dob = dob;
        this.gender = gender;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.department = department;
        this.appointmentDate = appointmentDate;
    }

    // getters setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPatientId() { 
        return userId; 
    }
    
    public void setPatientId(Long patientId) { 
        this.userId = patientId; 
    }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    
    public String getTransactionNumber() { return transactionNumber; }
    public void setTransactionNumber(String transactionNumber) { this.transactionNumber = transactionNumber; }
    
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { 
        this.roomNumber = roomNumber;
    }
    
    public Integer getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Integer queueNumber) { this.queueNumber = queueNumber; }
    
    public String getExpectedTimeSlot() { return expectedTimeSlot; }
    public void setExpectedTimeSlot(String expectedTimeSlot) { this.expectedTimeSlot = expectedTimeSlot; }
    
    public BigDecimal getExaminationFee() { return examinationFee; }
    public void setExaminationFee(BigDecimal examinationFee) { this.examinationFee = examinationFee; }
    
    public String getInsuranceType() { return insuranceType; }
    public void setInsuranceType(String insuranceType) { this.insuranceType = insuranceType; }
    
    public String getPatientCode() { return patientCode; }
    public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
    
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    
    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }
    
    public Boolean getAutoApproved() { return autoApproved; }
    public void setAutoApproved(Boolean autoApproved) { this.autoApproved = autoApproved; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedSession() { return assignedSession; }
    public void setAssignedSession(String assignedSession) { this.assignedSession = assignedSession; }

    public String getExaminationStatus() { return examinationStatus; }
    public void setExaminationStatus(String examinationStatus) { this.examinationStatus = examinationStatus; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public Boolean getReminderSent() { return reminderSent; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }
    
    public LocalDateTime getLastReminderSentAt() { return lastReminderSentAt; }
    public void setLastReminderSentAt(LocalDateTime lastReminderSentAt) { this.lastReminderSentAt = lastReminderSentAt; }

    @Override
    public String toString() {
        return "PatientRegistration{" +
                "id=" + id +
                ", fullName='" + fullName + '\'' +
                ", dob=" + dob +
                ", gender='" + gender + '\'' +
                ", phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                ", address='" + address + '\'' +
                ", department='" + department + '\'' +
                ", appointmentDate=" + appointmentDate +
                ", doctorId=" + doctorId +
                ", userId=" + userId +
                ", doctor=" + (doctor != null ? doctor.getFullName() : "null") +
                ", assignedSession='" + assignedSession + '\'' +
                ", status='" + status + '\'' +
                ", examinationStatus='" + examinationStatus + '\'' +
                ", paymentStatus='" + paymentStatus + '\'' +
                ", reminderSent=" + reminderSent +
                '}';
    }
}