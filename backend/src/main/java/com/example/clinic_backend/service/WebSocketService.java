package com.example.clinic_backend.service;

import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    // Thông báo khi có lịch hẹn mới
    public void notifyNewAppointment(PatientRegistration appointment) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "NEW_APPOINTMENT");
            notification.put("appointmentId", appointment.getId());
            notification.put("patientName", appointment.getFullName());
            notification.put("department", appointment.getDepartment());
            notification.put("createdAt", LocalDateTime.now());
            notification.put("registrationNumber", appointment.getRegistrationNumber());
            
            // Gửi đến admin
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
            
            System.out.println("Đã gửi thông báo lịch hẹn mới qua WebSocket");
            
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo lịch hẹn mới: " + e.getMessage());
        }
    }
    
    // Thông báo khi có lịch hẹn bị hủy
    public void notifyAppointmentCancelled(PatientRegistration appointment) {
        try {
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
            
            // Gửi đến bệnh nhân cụ thể
            if (appointment.getUserId() != null) {
                messagingTemplate.convertAndSendToUser(
                    appointment.getUserId().toString(),
                    "/queue/appointments",
                    notification
                );
            }
            
            System.out.println("Đã gửi thông báo hủy lịch qua WebSocket");
            
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo hủy lịch qua WebSocket: " + e.getMessage());
        }
    }
    
    // Gửi thông báo cho admin
    public void sendNotificationToAdmins(Map<String, Object> notification) {
        try {
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
            System.out.println("Đã gửi thông báo cho admin qua WebSocket");
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo cho admin: " + e.getMessage());
        }
    }
}