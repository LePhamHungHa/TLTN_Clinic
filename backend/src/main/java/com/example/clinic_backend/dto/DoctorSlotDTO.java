package com.example.clinic_backend.dto;

public class DoctorSlotDTO {
    private Long id;
    private Long doctorId;
    private String appointmentDate;
    private String timeSlot;
    private Integer maxPatients;
    private Integer currentPatients;
    private Boolean available;

    // Constructors
    public DoctorSlotDTO() {}

    public DoctorSlotDTO(Long id, Long doctorId, String appointmentDate, String timeSlot, 
                        Integer maxPatients, Integer currentPatients) {
        this.id = id;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.timeSlot = timeSlot;
        this.maxPatients = maxPatients;
        this.currentPatients = currentPatients;
        this.available = currentPatients < maxPatients;
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
        this.available = currentPatients < maxPatients;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }
}