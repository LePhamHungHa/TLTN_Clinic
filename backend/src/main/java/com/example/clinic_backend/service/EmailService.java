package com.example.clinic_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private com.example.clinic_backend.repository.PatientRegistrationRepository patientRegistrationRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // ==================== 1. EMAIL KHI ĐƠN ĐƯỢC DUYỆT ====================
    public void sendApprovalEmail(com.example.clinic_backend.model.PatientRegistration appointment) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Đơn {} không có email, không gửi email duyệt", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("✅ ĐƠN ĐĂNG KÝ KHÁM ĐÃ ĐƯỢC DUYỆT - " + appointment.getRegistrationNumber());
            
            String emailContent = buildApprovalEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("✅ Đã gửi email duyệt đơn thành công cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("❌ Lỗi khi gửi email duyệt đơn: {}", e.getMessage(), e);
        }
    }

    // ==================== 2. EMAIL KHI THANH TOÁN THÀNH CÔNG ====================
    public void sendPaymentSuccessEmail(com.example.clinic_backend.model.PatientRegistration appointment) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Đơn {} không có email, không gửi email thanh toán", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("💳 THANH TOÁN THÀNH CÔNG - " + appointment.getRegistrationNumber());
            
            String emailContent = buildPaymentSuccessEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("✅ Đã gửi email thanh toán thành công cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("❌ Lỗi khi gửi email thanh toán: {}", e.getMessage(), e);
        }
    }

    // ==================== 3. EMAIL NHẮC LỊCH TỰ ĐỘNG 8H SÁNG ====================
    @Scheduled(cron = "0 30 9 * * ?")
    public void sendDailyAppointmentReminders() {
        try {
            logger.info("⏰ Bắt đầu gửi email nhắc lịch khám...");

            LocalDate tomorrow = LocalDate.now().plusDays(1);
            
            List<com.example.clinic_backend.model.PatientRegistration> tomorrowAppointments = patientRegistrationRepository
                    .findByAppointmentDateAndStatus(tomorrow, "APPROVED");

            logger.info("📅 Tìm thấy {} lịch hẹn vào ngày mai", tomorrowAppointments.size());

            int sentCount = 0;
            for (com.example.clinic_backend.model.PatientRegistration appointment : tomorrowAppointments) {
                if (sendReminderEmail(appointment)) {
                    sentCount++;
                }
            }

            logger.info("✅ Đã gửi {} email nhắc lịch thành công", sentCount);

        } catch (Exception e) {
            logger.error("❌ Lỗi khi gửi email nhắc lịch: {}", e.getMessage(), e);
        }
    }

    private boolean sendReminderEmail(com.example.clinic_backend.model.PatientRegistration appointment) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                return false;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("🔔 NHẮC LỊCH KHÁM: Lịch hẹn của bạn vào NGÀY MAI");

            String emailContent = buildReminderEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("📧 Đã gửi email nhắc lịch cho: {}", appointment.getEmail());
            return true;

        } catch (Exception e) {
            logger.error("❌ Lỗi gửi email nhắc lịch cho {}: {}", 
                        appointment.getEmail(), e.getMessage(), e);
            return false;
        }
    }

    // ==================== Mau mail ====================

    private String buildApprovalEmailContent(com.example.clinic_backend.model.PatientRegistration appointment) {
        String appointmentDate = formatDate(appointment.getAppointmentDate());
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";
        String department = appointment.getDepartment() != null ? 
            appointment.getDepartment() : "N/A";
        String roomNumber = appointment.getRoomNumber() != null ? 
            appointment.getRoomNumber() : "";
        String queueNumber = appointment.getQueueNumber() != null ? 
            String.valueOf(appointment.getQueueNumber()) : "";
        String examinationFee = appointment.getExaminationFee() != null ? 
            String.format("%,d", appointment.getExaminationFee().intValue()) : "0";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }")
            .append(".container { max-width: 600px; margin: 0 auto; background: #ffffff; }")
            .append(".header { background: linear-gradient(135deg, #52c41a, #389e0d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }")
            .append(".content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }")
            .append(".info-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #52c41a; }")
            .append(".footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }")
            .append(".button { display: inline-block; padding: 12px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }")
            .append(".status-badge { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; padding: 8px 16px; border-radius: 20px; font-weight: bold; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'><h1>✅ ĐƠN ĐĂNG KÝ ĐÃ ĐƯỢC DUYỆT</h1><p>Bệnh Viện Đại Học Y Dược Tp HCM</p></div>")
            .append("<div class='content'>")
            .append("<div class='info-card'>")
            .append("<div style='text-align: center; margin-bottom: 20px;'><span class='status-badge'>ĐÃ ĐƯỢC DUYỆT</span></div>")
            .append("<h3>Kính gửi: <strong>").append(appointment.getFullName()).append("</strong></h3>")
            .append("<p>Đơn đăng ký khám của Quý khách đã được duyệt thành công.</p>")
            .append("<div style='background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h4>📋 Thông tin lịch hẹn</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Ngày khám:</strong> <span style='color: #1890ff; font-weight: bold;'>").append(appointmentDate).append("</span></p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>");
        
        if (!roomNumber.isEmpty()) {
            html.append("<p><strong>Phòng khám:</strong> ").append(roomNumber).append("</p>");
        }
        if (!queueNumber.isEmpty()) {
            html.append("<p><strong>Số thứ tự:</strong> ").append(queueNumber).append("</p>");
        }
        
        html.append("</div><div style='background: #fff7e6; padding: 20px; border-radius: 8px;'>")
            .append("<h4>💳 Thanh toán</h4>")
            .append("<p><strong>Phí khám:</strong> <span style='font-size: 20px; color: #fa541c; font-weight: bold;'>")
            .append(examinationFee).append(" VND</span></p>")
            .append("<p>Vui lòng thanh toán phí khám để hoàn tất đặt lịch.</p>")
            .append("</div></div>")
            .append("<div style='text-align: center; margin: 25px 0;'>")
            .append("<a href='").append(frontendUrl).append("/appointments' class='button'>💳 Thanh toán ngay</a>")
            .append("</div><div class='footer'>")
            .append("<p><strong>📞 Hotline:</strong> 1900 9090</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div></div></div></body></html>");

        return html.toString();
    }

    private String buildPaymentSuccessEmailContent(com.example.clinic_backend.model.PatientRegistration appointment) {
        String appointmentDate = formatDate(appointment.getAppointmentDate());
        String paymentDate = formatDateTime(appointment.getPaidAt());
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";
        String department = appointment.getDepartment() != null ? 
            appointment.getDepartment() : "N/A";
        String transactionNumber = appointment.getTransactionNumber() != null ? 
            appointment.getTransactionNumber() : "";
        String paidAmount = appointment.getPaidAmount() != null ? 
            String.format("%,d", appointment.getPaidAmount().intValue()) : "0";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }")
            .append(".container { max-width: 600px; margin: 0 auto; background: #ffffff; }")
            .append(".header { background: linear-gradient(135deg, #1890ff, #096dd9); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }")
            .append(".content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }")
            .append(".info-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1890ff; }")
            .append(".footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }")
            .append(".payment-success { background: #f6ffed; border: 2px solid #b7eb8f; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'><h1>💳 THANH TOÁN THÀNH CÔNG</h1><p>Bệnh Viện Đại Học Y Dược Tp HCM</p></div>")
            .append("<div class='content'>")
            .append("<div class='payment-success'>")
            .append("<h2 style='color: #52c41a; margin: 0;'>✅ Thanh toán thành công!</h2>")
            .append("<p style='margin: 10px 0 0 0;'>Cảm ơn Quý khách đã thanh toán phí khám bệnh</p>")
            .append("</div><div class='info-card'>")
            .append("<h3>Thông tin thanh toán</h3>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Bệnh nhân:</strong> ").append(appointment.getFullName()).append("</p>")
            .append("<p><strong>Số tiền:</strong> <span style='color: #fa541c; font-size: 20px; font-weight: bold;'>")
            .append(paidAmount).append(" VND</span></p>")
            .append("<p><strong>Thời gian thanh toán:</strong> ").append(paymentDate).append("</p>");
        
        if (!transactionNumber.isEmpty()) {
            html.append("<p><strong>Mã giao dịch:</strong> ").append(transactionNumber).append("</p>");
        }
        
        html.append("</div><div class='info-card'>")
            .append("<h3>📋 Thông tin lịch hẹn</h3>")
            .append("<p><strong>Ngày khám:</strong> <span style='color: #1890ff; font-weight: bold;'>").append(appointmentDate).append("</span></p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>")
            .append("<p><strong>Trạng thái:</strong> <span style='color: #52c41a; font-weight: bold;'>SẴN SÀNG KHÁM</span></p>")
            .append("</div><div style='background: #fff7e6; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h4>📍 Lưu ý quan trọng</h4>")
            .append("<ul style='margin: 10px 0; padding-left: 20px;'>")
            .append("<li>Vui lòng đến trước <strong>15 phút</strong> để làm thủ tục</li>")
            .append("<li>Mang theo CMND/CCCD và thẻ BHYT (nếu có)</li>")
            .append("<li>Mang theo các kết quả xét nghiệm, chẩn đoán hình ảnh cũ (nếu có)</li>")
            .append("</ul></div><div class='footer'>")
            .append("<p><strong>📞 Hotline:</strong> 1900 9090</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div></div></div></body></html>");

        return html.toString();
    }

    private String buildReminderEmailContent(com.example.clinic_backend.model.PatientRegistration appointment) {
        String appointmentDate = formatDate(appointment.getAppointmentDate());
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";
        String department = appointment.getDepartment() != null ? 
            appointment.getDepartment() : "N/A";
        String roomNumber = appointment.getRoomNumber() != null ? 
            appointment.getRoomNumber() : "";
        String queueNumber = appointment.getQueueNumber() != null ? 
            String.valueOf(appointment.getQueueNumber()) : "";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }")
            .append(".container { max-width: 600px; margin: 0 auto; background: #ffffff; }")
            .append(".header { background: linear-gradient(135deg, #faad14, #d48806); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }")
            .append(".content { padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; }")
            .append(".info-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #faad14; }")
            .append(".footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }")
            .append(".reminder-badge { background: #fff566; color: #874d00; padding: 10px 20px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 15px; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'><h1>🔔 NHẮC LỊCH KHÁM</h1><p>Bệnh Viện Đại Học Y Dược Tp HCM</p></div>")
            .append("<div class='content'>")
            .append("<div style='text-align: center; margin-bottom: 20px;'><span class='reminder-badge'>LỊCH KHÁM VÀO NGÀY MAI</span></div>")
            .append("<div class='info-card'>")
            .append("<h3>Kính gửi: <strong>").append(appointment.getFullName()).append("</strong></h3>")
            .append("<p>Đây là email nhắc lịch khám cho đơn đăng ký của bạn.</p>")
            .append("<div style='background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h4>📋 Thông tin lịch hẹn</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Ngày khám:</strong> <span style='color: #1890ff; font-weight: bold;'>").append(appointmentDate).append(" (NGÀY MAI)</span></p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>");
        
        if (!roomNumber.isEmpty()) {
            html.append("<p><strong>Phòng khám:</strong> ").append(roomNumber).append("</p>");
        }
        if (!queueNumber.isEmpty()) {
            html.append("<p><strong>Số thứ tự:</strong> ").append(queueNumber).append("</p>");
        }
        
        html.append("</div></div>")
            .append("<div style='background: #fff2e8; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h4>📍 Hướng dẫn quan trọng</h4>")
            .append("<ul style='margin: 10px 0; padding-left: 20px;'>")
            .append("<li><strong>Vui lòng đến trước 15 phút</strong> để làm thủ tục</li>")
            .append("<li>Mang theo <strong>CMND/CCCD</strong> và <strong>thẻ BHYT</strong> (nếu có)</li>")
            .append("<li>Chuẩn bị sẵn các kết quả xét nghiệm, chẩn đoán hình ảnh cũ (nếu có)</li>")
            .append("<li>Nếu không thể đến được, vui lòng liên hệ hotline để hủy lịch</li>")
            .append("</ul></div><div class='footer'>")
            .append("<p><strong>📞 Hotline hỗ trợ:</strong> 1900 9090</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div></div></div></body></html>");

        return html.toString();
    }

    // Utility methods
    private String formatDate(java.time.LocalDate date) {
        if (date == null) return "Chưa xác định";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return date.format(formatter);
    }

    private String formatDateTime(java.time.LocalDateTime date) {
        if (date == null) return "Chưa xác định";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return date.format(formatter);
    }
}