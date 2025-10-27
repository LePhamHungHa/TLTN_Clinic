// DoctorSlot.java
package com.example.clinic_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_slots")
public class DoctorSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "appointment_date")
    private String appointmentDate;

    @Column(name = "time_slot")
    private String timeSlot;

    @Column(name = "max_patients")
    private Integer maxPatients = 10;

    @Column(name = "current_patients")
    private Integer currentPatients = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public DoctorSlot() {
        this.createdAt = LocalDateTime.now();
    }

    public DoctorSlot(Long doctorId, String appointmentDate, String timeSlot) {
        this();
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.timeSlot = timeSlot;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(String appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
    }

    public Integer getMaxPatients() {
        return maxPatients;
    }

    public void setMaxPatients(Integer maxPatients) {
        this.maxPatients = maxPatients;
    }

    public Integer getCurrentPatients() {
        return currentPatients;
    }

    public void setCurrentPatients(Integer currentPatients) {
        this.currentPatients = currentPatients;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}