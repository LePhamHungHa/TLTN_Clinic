package com.example.clinic_backend.dto;

import java.time.LocalDate;

public class BmiRequest {
    private Double height;
    private Double weight;
    private String gender;
    private Double bmiValue;
    private String bmiCategory;
    private LocalDate measurementDate;
    
    // Default constructor
    public BmiRequest() {}
    
    // Getters and Setters
    public Double getHeight() {
        return height;
    }
    
    public void setHeight(Double height) {
        this.height = height;
    }
    
    public Double getWeight() {
        return weight;
    }
    
    public void setWeight(Double weight) {
        this.weight = weight;
    }
    
    public String getGender() {
        return gender;
    }
    
    public void setGender(String gender) {
        this.gender = gender;
    }
    
    public Double getBmiValue() {
        return bmiValue;
    }
    
    public void setBmiValue(Double bmiValue) {
        this.bmiValue = bmiValue;
    }
    
    public String getBmiCategory() {
        return bmiCategory;
    }
    
    public void setBmiCategory(String bmiCategory) {
        this.bmiCategory = bmiCategory;
    }
    
    public LocalDate getMeasurementDate() {
        return measurementDate;
    }
    
    public void setMeasurementDate(LocalDate measurementDate) {
        this.measurementDate = measurementDate;
    }
}