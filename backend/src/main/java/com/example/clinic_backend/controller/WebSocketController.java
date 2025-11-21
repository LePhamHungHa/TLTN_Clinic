package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Gửi thông báo khi có đơn mới
    public void sendNewAppointmentNotification(PatientRegistration appointment) {
        try {
            System.out.println("🔔 Đang gửi thông báo WebSocket cho đơn đăng ký mới: " + appointment.getId());
            
            // Tạo đối tượng thông báo
            AppointmentNotification notification = new AppointmentNotification(
                appointment.getId(),
                appointment.getFullName(),
                appointment.getPhone(),
                appointment.getEmail(),
                appointment.getDepartment(),
                appointment.getAppointmentDate(),
                appointment.getSymptoms(),
                appointment.getCreatedAt()
            );

            // Gửi đến tất cả client đang subscribe
            messagingTemplate.convertAndSend("/topic/new-appointments", notification);
            
            System.out.println("✅ Đã gửi thông báo WebSocket thành công");
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi thông báo WebSocket: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Class inner cho thông báo
    public static class AppointmentNotification {
        private Long id;
        private String fullName;
        private String phone;
        private String email;
        private String department;
        private LocalDate appointmentDate;
        private String symptoms;
        private LocalDateTime createdAt;

        public AppointmentNotification() {}

        public AppointmentNotification(Long id, String fullName, String phone, String email, 
                                     String department, LocalDate appointmentDate, 
                                     String symptoms, LocalDateTime createdAt) {
            this.id = id;
            this.fullName = fullName;
            this.phone = phone;
            this.email = email;
            this.department = department;
            this.appointmentDate = appointmentDate;
            this.symptoms = symptoms;
            this.createdAt = createdAt;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public LocalDate getAppointmentDate() { return appointmentDate; }
        public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

        public String getSymptoms() { return symptoms; }
        public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}