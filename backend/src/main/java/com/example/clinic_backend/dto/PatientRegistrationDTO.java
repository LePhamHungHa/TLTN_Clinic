package com.example.clinic_backend.dto;

public class PatientRegistrationDTO {
    private String fullName;
    private String dob;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String symptoms;
    private String appointmentDate;
    private String department;
    private Long doctorId;
    private String timeSlot;

    // Getters and Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }

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

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    @Override
    public String toString() {
        return "PatientRegistrationDTO{" +
                "fullName='" + fullName + '\'' +
                ", dob='" + dob + '\'' +
                ", gender='" + gender + '\'' +
                ", phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                ", address='" + address + '\'' +
                ", symptoms='" + symptoms + '\'' +
                ", appointmentDate='" + appointmentDate + '\'' +
                ", department='" + department + '\'' +
                ", doctorId=" + doctorId +
                ", timeSlot='" + timeSlot + '\'' +
                '}';
    }
}