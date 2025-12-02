package com.example.clinic_backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;

public class MedicationHistoryDTO {
    private Long id;
    private Long medicalRecordId;
    private Long medicineId;
    private String medicineName;
    private String dosage;
    private String frequency;
    private String duration;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String instructions;
    private String notes;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date examinationDate;
    
    private String registrationNumber;
    private String unit;
    private String strength;
    private String category;
    private Long patientId;

    // Constructors
    public MedicationHistoryDTO() {}

    public MedicationHistoryDTO(Long id, Long medicalRecordId, Long medicineId, String medicineName, 
                               String dosage, String frequency, String duration, Integer quantity,
                               BigDecimal unitPrice, BigDecimal totalPrice, String instructions, 
                               String notes, LocalDateTime createdAt, Date examinationDate,
                               String registrationNumber, String unit, String strength, 
                               String category, Long patientId) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
        this.instructions = instructions;
        this.notes = notes;
        this.createdAt = createdAt;
        this.examinationDate = examinationDate;
        this.registrationNumber = registrationNumber;
        this.unit = unit;
        this.strength = strength;
        this.category = category;
        this.patientId = patientId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Date getExaminationDate() { return examinationDate; }
    public void setExaminationDate(Date examinationDate) { this.examinationDate = examinationDate; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getStrength() { return strength; }
    public void setStrength(String strength) { this.strength = strength; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    @Override
    public String toString() {
        return "MedicationHistoryDTO{" +
                "id=" + id +
                ", medicineName='" + medicineName + '\'' +
                ", dosage='" + dosage + '\'' +
                ", examinationDate=" + examinationDate +
                ", quantity=" + quantity +
                ", totalPrice=" + totalPrice +
                '}';
    }
}