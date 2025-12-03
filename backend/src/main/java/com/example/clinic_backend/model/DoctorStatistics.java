package com.example.clinic_backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_statistics")
public class DoctorStatistics {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;
    
    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;
    
    @Column(name = "stat_type", nullable = false) 
    private String statType;
    
    @Column(name = "total_appointments", nullable = false)
    private Integer totalAppointments = 0;
    
    @Column(name = "completed_appointments", nullable = false)
    private Integer completedAppointments = 0;
    
    @Column(name = "cancelled_appointments", nullable = false)
    private Integer cancelledAppointments = 0;
    
    @Column(name = "no_show_appointments", nullable = false)
    private Integer noShowAppointments = 0;
    
    @Column(name = "success_rate")
    private Double successRate;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public DoctorStatistics() {
        this.createdAt = LocalDateTime.now();
    }
    
    public DoctorStatistics(Long doctorId, LocalDate statDate, String statType) {
        this();
        this.doctorId = doctorId;
        this.statDate = statDate;
        this.statType = statType;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    
    public LocalDate getStatDate() { return statDate; }
    public void setStatDate(LocalDate statDate) { this.statDate = statDate; }
    
    public String getStatType() { return statType; }
    public void setStatType(String statType) { this.statType = statType; }
    
    public Integer getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(Integer totalAppointments) { 
        this.totalAppointments = totalAppointments; 
    }
    
    public Integer getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(Integer completedAppointments) { 
        this.completedAppointments = completedAppointments; 
    }
    
    public Integer getCancelledAppointments() { return cancelledAppointments; }
    public void setCancelledAppointments(Integer cancelledAppointments) { 
        this.cancelledAppointments = cancelledAppointments; 
    }
    
    public Integer getNoShowAppointments() { return noShowAppointments; }
    public void setNoShowAppointments(Integer noShowAppointments) { 
        this.noShowAppointments = noShowAppointments; 
    }
    
    public Double getSuccessRate() { return successRate; }
    public void setSuccessRate(Double successRate) { this.successRate = successRate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public void calculateSuccessRate() {
        if (totalAppointments > 0) {
            this.successRate = (completedAppointments.doubleValue() / totalAppointments.doubleValue()) * 100;
        } else {
            this.successRate = 0.0;
        }
    }
    
    public Double getFailureRate() {
        if (totalAppointments > 0) {
            return 100 - successRate;
        }
        return 0.0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateSuccessRate();
    }
    
    @PrePersist
    protected void onCreate() {
        calculateSuccessRate();
    }
}