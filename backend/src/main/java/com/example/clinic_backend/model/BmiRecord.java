package com.example.clinic_backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bmi_records")
public class BmiRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "patient_id")
    private Long patientId;
    
    @Column(name = "height")
    private Double height;
    
    @Column(name = "weight")
    private Double weight;
    
    @Column(name = "gender")
    private String gender;
    
    @Column(name = "bmi_value")
    private Double bmiValue;
    
    @Column(name = "bmi_category", length = 50)
    private String bmiCategory;
    
    @Column(name = "measurement_date")
    private LocalDate measurementDate;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public BmiRecord() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public BmiRecord(Long patientId, Double height, Double weight, String gender,
                    Double bmiValue, String bmiCategory, LocalDate measurementDate) {
        this.patientId = patientId;
        this.height = height;
        this.weight = weight;
        this.gender = gender;
        this.bmiValue = bmiValue;
        this.bmiCategory = bmiCategory;
        this.measurementDate = measurementDate;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    
    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }
    
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public Double getBmiValue() { return bmiValue; }
    public void setBmiValue(Double bmiValue) { this.bmiValue = bmiValue; }
    
    public String getBmiCategory() { return bmiCategory; }
    public void setBmiCategory(String bmiCategory) { this.bmiCategory = bmiCategory; }
    
    public LocalDate getMeasurementDate() { return measurementDate; }
    public void setMeasurementDate(LocalDate measurementDate) { this.measurementDate = measurementDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}