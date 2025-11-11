package com.example.clinic_backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "dob")
    private LocalDate dob; // GIỮ LocalDate

    @Column(name = "bhyt")
    private String bhyt;

    private String phone;
    private String address;
    private String email;
    private String password;
    private String username;
    private String symptoms;

    @Column(name = "relative_name")
    private String relativeName;

    @Column(name = "relative_phone")
    private String relativePhone;

    @Column(name = "relative_address")
    private String relativeAddress;

    @Column(name = "relative_relationship")
    private String relativeRelationship;

    // Constructors
    public Patient() {}

    // Getters / Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getBhyt() { return bhyt; }
    public void setBhyt(String bhyt) { this.bhyt = bhyt; }

    public String getRelativeName() { return relativeName; }
    public void setRelativeName(String relativeName) { this.relativeName = relativeName; }

    public String getRelativePhone() { return relativePhone; }
    public void setRelativePhone(String relativePhone) { this.relativePhone = relativePhone; }

    public String getRelativeAddress() { return relativeAddress; }
    public void setRelativeAddress(String relativeAddress) { this.relativeAddress = relativeAddress; }

    public String getRelativeRelationship() { return relativeRelationship; }
    public void setRelativeRelationship(String relativeRelationship) { this.relativeRelationship = relativeRelationship; }
}