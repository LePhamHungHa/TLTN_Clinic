package com.example.clinic_backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonIgnore; 
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "medical_records")
public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false)
    private Long appointmentId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    // Thông tin khám
    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(name = "history_of_illness", columnDefinition = "TEXT")
    private String historyOfIllness;

    @Column(name = "physical_examination", columnDefinition = "TEXT")
    private String physicalExamination;

    @Column(columnDefinition = "JSON")
    private String vitalSigns;

    // Chẩn đoán
    @Column(name = "preliminary_diagnosis", columnDefinition = "TEXT")
    private String preliminaryDiagnosis;

    @Column(name = "final_diagnosis", columnDefinition = "TEXT")
    private String finalDiagnosis;

    // Điều trị
    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(columnDefinition = "JSON")
    private String medications;

    @Column(name = "lab_tests", columnDefinition = "JSON")
    private String labTests;

    // Theo dõi
    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "follow_up_notes", columnDefinition = "TEXT")
    private String followUpNotes;

    @Column(columnDefinition = "TEXT")
    private String advice;

    // Trạng thái
    @Column(name = "examination_date", nullable = false)
    private LocalDate examinationDate;

    @Column(name = "examination_status")
    private String examinationStatus = "IN_PROGRESS";

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", insertable = false, updatable = false)
    private PatientRegistration appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", insertable = false, updatable = false)
    @JsonIgnore
    private Doctor doctor;

    // Helper methods for JSON fields
    public Map<String, Object> getVitalSignsMap() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(vitalSigns, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    public void setVitalSignsMap(Map<String, Object> vitalSigns) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.vitalSigns = mapper.writeValueAsString(vitalSigns);
        } catch (Exception e) {
            this.vitalSigns = "{}";
        }
    }

    public List<Map<String, Object>> getMedicationsList() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(medications, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public void setMedicationsList(List<Map<String, Object>> medications) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.medications = mapper.writeValueAsString(medications);
        } catch (Exception e) {
            this.medications = "[]";
        }
    }

    public List<Map<String, Object>> getLabTestsList() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(labTests, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public void setLabTestsList(List<Map<String, Object>> labTests) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.labTests = mapper.writeValueAsString(labTests);
        } catch (Exception e) {
            this.labTests = "[]";
        }
    }

    // Constructors
    public MedicalRecord() {
        this.examinationDate = LocalDate.now();
    }

    public MedicalRecord(Long appointmentId, Long doctorId) {
        this();
        this.appointmentId = appointmentId;
        this.doctorId = doctorId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getHistoryOfIllness() { return historyOfIllness; }
    public void setHistoryOfIllness(String historyOfIllness) { this.historyOfIllness = historyOfIllness; }

    public String getPhysicalExamination() { return physicalExamination; }
    public void setPhysicalExamination(String physicalExamination) { this.physicalExamination = physicalExamination; }

    public String getVitalSigns() { return vitalSigns; }
    public void setVitalSigns(String vitalSigns) { this.vitalSigns = vitalSigns; }

    public String getPreliminaryDiagnosis() { return preliminaryDiagnosis; }
    public void setPreliminaryDiagnosis(String preliminaryDiagnosis) { this.preliminaryDiagnosis = preliminaryDiagnosis; }

    public String getFinalDiagnosis() { return finalDiagnosis; }
    public void setFinalDiagnosis(String finalDiagnosis) { this.finalDiagnosis = finalDiagnosis; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public String getMedications() { return medications; }
    public void setMedications(String medications) { this.medications = medications; }

    public String getLabTests() { return labTests; }
    public void setLabTests(String labTests) { this.labTests = labTests; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }

    public String getFollowUpNotes() { return followUpNotes; }
    public void setFollowUpNotes(String followUpNotes) { this.followUpNotes = followUpNotes; }

    public String getAdvice() { return advice; }
    public void setAdvice(String advice) { this.advice = advice; }

    public LocalDate getExaminationDate() { return examinationDate; }
    public void setExaminationDate(LocalDate examinationDate) { this.examinationDate = examinationDate; }

    public String getExaminationStatus() { return examinationStatus; }
    public void setExaminationStatus(String examinationStatus) { this.examinationStatus = examinationStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public PatientRegistration getAppointment() { return appointment; }
    public void setAppointment(PatientRegistration appointment) { this.appointment = appointment; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
}