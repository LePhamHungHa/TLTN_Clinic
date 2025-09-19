package com.example.clinic_backend.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;

public class RegisterRequest {

    @NotBlank(message = "Username không được để trống")
    private String username;

    @NotBlank(message = "Password không được để trống")
    private String password;

    private String role; // mặc định có thể là PATIENT

    // Thông tin bệnh nhân
    private String fullName;
    private LocalDate dob;      
    private String phone;
    private String address;
    private String email;
    private String symptoms;
    private String bhyt;

    // ===== Constructor =====
    public RegisterRequest() {}

    public RegisterRequest(String username, String password, String role, 
                           String fullName, LocalDate dob, String phone, 
                           String address, String email, String symptoms, String bhyt) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.fullName = fullName;
        this.dob = dob;
        this.phone = phone;
        this.address = address;
        this.email = email;
        this.symptoms = symptoms;
        this.bhyt = bhyt;
    }

    // ===== Getters / Setters =====
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    
    public String getBhyt() { return bhyt; }
    public void setBhyt(String bhyt) { this.bhyt = bhyt; }

    // ===== toString =====
    @Override
    public String toString() {
        return "RegisterRequest{" +
                "username='" + username + '\'' +
                ", fullName='" + fullName + '\'' +
                ", dob=" + dob +
                ", phone='" + phone + '\'' +
                ", address='" + address + '\'' +
                ", email='" + email + '\'' +
                ", symptoms='" + symptoms + '\'' +
                ", bhyt='" + bhyt + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
