package com.example.clinic_backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescription_details")
public class PrescriptionDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medical_record_id", nullable = false)
    private Long medicalRecordId;

    @Column(name = "medicine_id", nullable = false)
    private Long medicineId;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "dosage", nullable = false)
    private String dosage;

    @Column(name = "frequency", nullable = false)
    private String frequency;

    @Column(name = "duration", nullable = false)
    private String duration;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Relationships với @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", insertable = false, updatable = false)
    @JsonIgnore
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    @JsonIgnore
    private Medicine medicine;

    // Constructors
    public PrescriptionDetail() {}

    public PrescriptionDetail(Long medicalRecordId, Long medicineId, String medicineName, 
                            String dosage, String frequency, String duration, 
                            Integer quantity, BigDecimal unitPrice) {
        this.medicalRecordId = medicalRecordId;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
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
    public void setQuantity(Integer quantity) { 
        this.quantity = quantity;
        calculateTotalPrice();
    }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { 
        this.unitPrice = unitPrice;
        calculateTotalPrice();
    }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public MedicalRecord getMedicalRecord() { return medicalRecord; }
    public void setMedicalRecord(MedicalRecord medicalRecord) { this.medicalRecord = medicalRecord; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    private void calculateTotalPrice() {
        if (this.unitPrice != null && this.quantity != null) {
            this.totalPrice = this.unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        }
    }
}