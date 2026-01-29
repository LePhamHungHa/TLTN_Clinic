package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Gửi thông báo khi có đơn đăng ký mới
    public void sendNewAppointmentNotification(PatientRegistration appointment) {
        try {
            System.out.println("Đang gửi thông báo WebSocket cho đơn đăng ký mới: " + appointment.getId());
            
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
            
            System.out.println("Đã gửi thông báo WebSocket thành công");
        } catch (Exception e) {
            System.out.println("Lỗi khi gửi thông báo WebSocket: " + e.getMessage());
        }
    }

    // Gửi thông báo khi có lịch hẹn bị hủy
    public void sendCancellationNotification(PatientRegistration appointment) {
        try {
            System.out.println("Đang gửi thông báo WebSocket cho lịch hẹn bị hủy: " + appointment.getId());
            
            // Tạo thông báo hủy lịch
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "APPOINTMENT_CANCELLED");
            notification.put("appointmentId", appointment.getId());
            notification.put("patientName", appointment.getFullName());
            notification.put("registrationNumber", appointment.getRegistrationNumber());
            notification.put("department", appointment.getDepartment());
            notification.put("cancelledAt", LocalDateTime.now());
            notification.put("refundRequested", "REQUESTED".equals(appointment.getRefundStatus()));
            
            // Gửi đến admin
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
            
            System.out.println("Đã gửi thông báo hủy lịch WebSocket thành công");
        } catch (Exception e) {
            System.out.println("Lỗi khi gửi thông báo hủy lịch WebSocket: " + e.getMessage());
        }
    }

    // Gửi thông báo cho admin
    public void sendNotificationToAdmins(Map<String, Object> notification) {
        try {
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
            System.out.println("Đã gửi thông báo cho admin");
        } catch (Exception e) {
            System.out.println("Lỗi gửi thông báo cho admin: " + e.getMessage());
        }
    }

    // Gửi thông báo cho user cụ thể
    public void sendNotificationToUser(Long userId, Map<String, Object> notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/appointments",
                notification
            );
            System.out.println("Đã gửi thông báo cho user: " + userId);
        } catch (Exception e) {
            System.out.println("Lỗi gửi thông báo cho user: " + e.getMessage());
        }
    }

    // Class inner cho thông báo đăng ký mới
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

        // Getter và Setter
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