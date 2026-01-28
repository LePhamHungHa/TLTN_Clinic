package com.example.clinic_backend.service;

import com.example.clinic_backend.controller.WebSocketController;
import com.example.clinic_backend.model.PatientRegistration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private WebSocketController webSocketController;

    public void notifyNewAppointment(PatientRegistration appointment) {
        try {
            System.out.println("WebSocketService: Gửi thông báo về cuộc hẹn " + appointment.getId());
            webSocketController.sendNewAppointmentNotification(appointment);
        } catch (Exception e) {
            System.err.println("Lỗi: " + e.getMessage());
            e.printStackTrace();
        }
    }
}