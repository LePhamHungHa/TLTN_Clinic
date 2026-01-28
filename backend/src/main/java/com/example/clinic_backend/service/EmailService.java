package com.example.clinic_backend.service;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    
    private static final String PRIMARY_COLOR = "#1E88E5";
    private static final String PRIMARY_LIGHT = "#64B5F6";
    private static final String PRIMARY_DARK = "#1565C0";
    private static final String SECONDARY_COLOR = "#4CAF50"; 
    private static final String WARNING_COLOR = "#FF9800"; 
    // Thời gian gửi email tự động
    private static final String REMINDER_START_TIME = "00:00";
    private static final String REMINDER_END_TIME = "23:59";

    // Biến để tránh gửi trùng lặp
    private final AtomicBoolean isSendingReminders = new AtomicBoolean(false);

    // 1. Gửi email khi đơn được duyệt
    public void sendApprovalEmail(PatientRegistration appointment) {
        try {
            // Kiểm tra xem có email không
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Không có email cho đơn: {}", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("Đơn đăng ký khám đã được duyệt - " + appointment.getRegistrationNumber());
            
            // Nội dung email
            String emailContent = buildApprovalEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("Đã gửi email duyệt đơn cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("Lỗi gửi email duyệt đơn: {}", e.getMessage());
        }
    }

    // 2. Gửi email khi thanh toán thành công
    public void sendPaymentSuccessEmail(PatientRegistration appointment) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Không có email cho đơn: {}", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("Thanh toán thành công - " + appointment.getRegistrationNumber());
            
            String emailContent = buildPaymentSuccessEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("Đã gửi email thanh toán cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("Lỗi gửi email thanh toán: {}", e.getMessage());
        }
    }

    // 3. Gửi email nhắc lịch tự động
    @Scheduled(fixedRate = 60000) // Chạy mỗi phút
    public void sendAppointmentReminders() {
        // Kiểm tra nếu đang gửi thì bỏ qua
        if (!isSendingReminders.compareAndSet(false, true)) {
            logger.info("Đang gửi email, bỏ qua lần này");
            return;
        }
        
        try {
            // Kiểm tra thời gian gửi
            if (!isWithinReminderTimeWindow()) {
                logger.debug("Ngoài khung giờ gửi email");
                return;
            }
            
            logger.info("Bắt đầu gửi email nhắc lịch...");

            // Lấy ngày mai
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            
            // Lấy danh sách lịch hẹn chưa được nhắc
            List<PatientRegistration> tomorrowAppointments = patientRegistrationRepository
                    .findByAppointmentDateAndStatusAndReminderNotSent(tomorrow, "APPROVED");

            logger.info("Tìm thấy {} lịch hẹn ngày mai", tomorrowAppointments.size());

            if (tomorrowAppointments.isEmpty()) {
                logger.info("Không có lịch hẹn nào");
                return;
            }

            int sentCount = 0;
            int failedCount = 0;
            
            // Gửi email cho từng lịch hẹn
            for (PatientRegistration appointment : tomorrowAppointments) {
                if (sendReminderEmail(appointment)) {
                    sentCount++;
                    
                    // Cập nhật trạng thái đã gửi
                    updateReminderSentStatus(appointment);
                } else {
                    failedCount++;
                }
                
                // Chờ một chút giữa các email
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            logger.info("Đã gửi {} email, thất bại: {}", sentCount, failedCount);

        } catch (Exception e) {
            logger.error("Lỗi khi gửi email nhắc lịch: {}", e.getMessage());
        } finally {
            // Đặt lại trạng thái
            isSendingReminders.set(false);
        }
    }

    // Cập nhật trạng thái đã gửi reminder
    private void updateReminderSentStatus(PatientRegistration appointment) {
        try {
            appointment.setReminderSent(true);
            appointment.setLastReminderSentAt(java.time.LocalDateTime.now());
            patientRegistrationRepository.save(appointment);
            logger.debug("Đã cập nhật trạng thái gửi reminder");
        } catch (Exception e) {
            logger.error("Lỗi cập nhật trạng thái: {}", e.getMessage());
        }
    }

    // Kiểm tra thời gian gửi email
    public boolean isWithinReminderTimeWindow() {
        try {
            LocalTime now = LocalTime.now();
            LocalTime startTime = LocalTime.parse(REMINDER_START_TIME);
            LocalTime endTime = LocalTime.parse(REMINDER_END_TIME);
            
            return !now.isBefore(startTime) && !now.isAfter(endTime);
        } catch (Exception e) {
            logger.error("Lỗi kiểm tra thời gian: {}", e.getMessage());
            return false;
        }
    }

    // Gửi email nhắc lịch
    private boolean sendReminderEmail(PatientRegistration appointment) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Không có email");
                return false;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("Nhắc lịch khám - " + appointment.getRegistrationNumber());

            String emailContent = buildReminderEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("Đã gửi email nhắc lịch cho: {}", appointment.getEmail());
            return true;

        } catch (Exception e) {
            logger.error("Lỗi gửi email nhắc lịch: {}", e.getMessage());
            return false;
        }
    }

    // Tạo nội dung email duyệt đơn
    private String buildApprovalEmailContent(PatientRegistration appointment) {
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
        
        // Thêm triệu chứng
        String symptoms = appointment.getSymptoms() != null ? 
            appointment.getSymptoms() : "Không có thông tin";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }")
            .append(".container { max-width: 600px; margin: auto; background: white; }")
            .append(".header { background: ").append(PRIMARY_COLOR).append("; color: white; padding: 25px; text-align: center; }")
            .append(".hospital-name { font-size: 18px; margin-top: 5px; opacity: 0.9; }")
            .append(".content { padding: 20px; background: #f8f9fa; }")
            .append(".info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ").append(PRIMARY_COLOR).append("; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
            .append(".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 15px; background: #f0f0f0; }")
            .append(".button { background: ").append(PRIMARY_COLOR).append("; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; }")
            .append(".button:hover { background: ").append(PRIMARY_DARK).append("; }")
            .append(".symptoms-box { background: #f0f8ff; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid ").append(PRIMARY_LIGHT).append("; }")
            .append(".payment-box { background: #e8f5e9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid ").append(SECONDARY_COLOR).append("; }")
            .append(".status-badge { background: #e8f5e9; color: ").append(SECONDARY_COLOR).append("; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 10px; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'>")
            .append("<h2 style='margin: 0;'>ĐƠN ĐĂNG KÝ ĐÃ ĐƯỢC DUYỆT</h2>")
            .append("<div class='hospital-name'>Bệnh Viện Đại Học Y Dược Tp.HCM</div>")
            .append("</div>")
            .append("<div class='content'>")
            .append("<div class='info-card'>")
            .append("<div style='text-align: center;'>")
            .append("<span class='status-badge'>ĐÃ ĐƯỢC DUYỆT</span>")
            .append("</div>")
            .append("<h3 style='color: ").append(PRIMARY_COLOR).append("; margin-top: 0;'>Kính gửi: ").append(appointment.getFullName()).append("</h3>")
            .append("<p>Đơn đăng ký khám của bạn đã được duyệt thành công.</p>")
            .append("<div style='background: #e3f2fd; padding: 15px; border-radius: 5px;'>")
            .append("<h4 style='color: ").append(PRIMARY_DARK).append("; margin-top: 0;'>Thông tin lịch hẹn</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Ngày khám:</strong> <span style='color: ").append(PRIMARY_COLOR).append("; font-weight: bold;'>").append(appointmentDate).append("</span></p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>");
        
        if (!roomNumber.isEmpty()) {
            html.append("<p><strong>Phòng khám:</strong> ").append(roomNumber).append("</p>");
        }
        if (!queueNumber.isEmpty()) {
            html.append("<p><strong>Số thứ tự:</strong> ").append(queueNumber).append("</p>");
        }
        
        html.append("</div>")
            .append("<div class='symptoms-box'>")
            .append("<h4 style='color: ").append(PRIMARY_DARK).append("; margin-top: 0;'>Triệu chứng / Mô tả tình trạng</h4>")
            .append("<p style='margin: 10px 0;'>").append(symptoms).append("</p>")
            .append("</div>")
            .append("<div class='payment-box'>")
            .append("<h4 style='color: #388e3c; margin-top: 0;'>Thanh toán</h4>")
            .append("<p><strong>Phí khám:</strong> <span style='font-size: 18px; color: #d32f2f; font-weight: bold;'>")
            .append(examinationFee).append(" VND</span></p>")
            .append("<p>Vui lòng thanh toán phí khám để hoàn tất đặt lịch.</p>")
            .append("</div>")
            .append("</div>")
            .append("<div style='text-align: center; margin: 20px 0;'>")
            .append("<a href='").append(frontendUrl).append("/appointments' class='button'>THANH TOÁN NGAY</a>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>📞 Hotline hỗ trợ:</strong> 1900 1234</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div>")
            .append("</div>")
            .append("</div></body></html>");

        return html.toString();
    }

    // Tạo nội dung email thanh toán
    private String buildPaymentSuccessEmailContent(PatientRegistration appointment) {
        String appointmentDate = formatDate(appointment.getAppointmentDate());
        String paymentDate = formatDateTime(appointment.getPaidAt());
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";
        String department = appointment.getDepartment() != null ? 
            appointment.getDepartment() : "N/A";
        String paidAmount = appointment.getPaidAmount() != null ? 
            String.format("%,d", appointment.getPaidAmount().intValue()) : "0";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; }")
            .append(".container { max-width: 600px; margin: auto; background: white; }")
            .append(".header { background: ").append(PRIMARY_COLOR).append("; color: white; padding: 25px; text-align: center; }")
            .append(".hospital-name { font-size: 18px; margin-top: 5px; opacity: 0.9; }")
            .append(".content { padding: 20px; background: #f8f9fa; }")
            .append(".success-box { background: #e8f5e9; padding: 25px; text-align: center; border-radius: 5px; margin: 15px 0; border: 2px solid ").append(SECONDARY_COLOR).append("; }")
            .append(".info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ").append(PRIMARY_COLOR).append("; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
            .append(".note-box { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ").append(WARNING_COLOR).append("; }")
            .append(".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 15px; background: #f0f0f0; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'>")
            .append("<h2 style='margin: 0;'>THANH TOÁN THÀNH CÔNG</h2>")
            .append("<div class='hospital-name'>Bệnh Viện Đại Học Y Dược Tp.HCM</div>")
            .append("</div>")
            .append("<div class='content'>")
            .append("<div class='success-box'>")
            .append("<h3 style='color: ").append(SECONDARY_COLOR).append("; margin: 0;'>✅ Thanh toán thành công!</h3>")
            .append("<p style='margin: 10px 0 0 0;'>Cảm ơn bạn đã thanh toán phí khám bệnh</p>")
            .append("</div>")
            .append("<div class='info-card'>")
            .append("<h4 style='color: ").append(PRIMARY_DARK).append("; margin-top: 0;'>Thông tin thanh toán</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Bệnh nhân:</strong> ").append(appointment.getFullName()).append("</p>")
            .append("<p><strong>Số tiền:</strong> <span style='color: #d32f2f; font-size: 18px; font-weight: bold;'>")
            .append(paidAmount).append(" VND</span></p>")
            .append("<p><strong>Thời gian thanh toán:</strong> ").append(paymentDate).append("</p>")
            .append("</div>")
            .append("<div class='info-card'>")
            .append("<h4 style='color: ").append(PRIMARY_DARK).append("; margin-top: 0;'>Thông tin lịch hẹn</h4>")
            .append("<p><strong>Ngày khám:</strong> <span style='color: ").append(PRIMARY_COLOR).append("; font-weight: bold;'>").append(appointmentDate).append("</span></p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>")
            .append("<p><strong>Trạng thái:</strong> <span style='color: ").append(SECONDARY_COLOR).append("; font-weight: bold;'>SẴN SÀNG KHÁM</span></p>")
            .append("</div>")
            .append("<div class='note-box'>")
            .append("<h4 style='color: ").append("#e65100").append("; margin-top: 0;'>Lưu ý quan trọng</h4>")
            .append("<ul style='margin: 10px 0; padding-left: 20px;'>")
            .append("<li>Vui lòng đến trước <strong>15 phút</strong> để làm thủ tục</li>")
            .append("<li>Mang theo <strong>CMND/CCCD</strong> và thẻ <strong>BHYT</strong> (nếu có)</li>")
            .append("<li>Mang theo các kết quả xét nghiệm, chẩn đoán hình ảnh cũ (nếu có)</li>")
            .append("</ul>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>📞 Hotline hỗ trợ:</strong> 1900 1234</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div>")
            .append("</div>")
            .append("</div></body></html>");

        return html.toString();
    }

    // Tạo nội dung email nhắc lịch
    private String buildReminderEmailContent(PatientRegistration appointment) {
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
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; }")
            .append(".container { max-width: 600px; margin: auto; background: white; }")
            .append(".header { background: ").append(PRIMARY_COLOR).append("; color: white; padding: 25px; text-align: center; }")
            .append(".hospital-name { font-size: 18px; margin-top: 5px; opacity: 0.9; }")
            .append(".content { padding: 20px; background: #f8f9fa; }")
            .append(".reminder-badge { background: #fff3e0; color: ").append("#e65100").append("; padding: 12px 25px; border-radius: 25px; font-weight: bold; display: inline-block; margin-bottom: 15px; border: 2px solid ").append(WARNING_COLOR).append("; }")
            .append(".info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ").append(WARNING_COLOR).append("; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
            .append(".note-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ").append(PRIMARY_COLOR).append("; }")
            .append(".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 15px; background: #f0f0f0; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'>")
            .append("<h2 style='margin: 0;'>NHẮC LỊCH KHÁM</h2>")
            .append("<div class='hospital-name'>Bệnh Viện Đại Học Y Dược Tp.HCM</div>")
            .append("</div>")
            .append("<div class='content'>")
            .append("<div style='text-align: center;'>")
            .append("<span class='reminder-badge'>LỊCH KHÁM VÀO NGÀY MAI</span>")
            .append("</div>")
            .append("<div class='info-card'>")
            .append("<h3 style='color: ").append(PRIMARY_COLOR).append("; margin-top: 0;'>Kính gửi: ").append(appointment.getFullName()).append("</h3>")
            .append("<p>Đây là email nhắc lịch khám cho đơn đăng ký của bạn.</p>")
            .append("<div style='background: #f0f8ff; padding: 15px; border-radius: 5px;'>")
            .append("<h4 style='color: ").append(PRIMARY_DARK).append("; margin-top: 0;'>Thông tin lịch hẹn</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Ngày khám:</strong> <span style='color: ").append(PRIMARY_COLOR).append("; font-weight: bold;'>").append(appointmentDate).append(" (NGÀY MAI)</span></p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>");
        
        if (!roomNumber.isEmpty()) {
            html.append("<p><strong>Phòng khám:</strong> ").append(roomNumber).append("</p>");
        }
        if (!queueNumber.isEmpty()) {
            html.append("<p><strong>Số thứ tự:</strong> ").append(queueNumber).append("</p>");
        }
        
        html.append("</div>")
            .append("</div>")
            .append("<div class='note-box'>")
            .append("<h4 style='color: ").append(PRIMARY_DARK).append("; margin-top: 0;'>Hướng dẫn quan trọng</h4>")
            .append("<ul style='margin: 10px 0; padding-left: 20px;'>")
            .append("<li><strong>Vui lòng đến trước 15 phút</strong> để làm thủ tục</li>")
            .append("<li>Mang theo <strong>CMND/CCCD</strong> và <strong>thẻ BHYT</strong> (nếu có)</li>")
            .append("<li>Chuẩn bị sẵn các kết quả xét nghiệm, chẩn đoán hình ảnh cũ (nếu có)</li>")
            .append("<li>Nếu không thể đến được, vui lòng liên hệ hotline để hủy lịch</li>")
            .append("</ul>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>📞 Hotline hỗ trợ:</strong> 1900 1234</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div>")
            .append("</div>")
            .append("</div></body></html>");

        return html.toString();
    }

    // Định dạng ngày
    private String formatDate(java.time.LocalDate date) {
        if (date == null) return "Chưa xác định";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return date.format(formatter);
    }

    // Định dạng ngày giờ
    private String formatDateTime(java.time.LocalDateTime date) {
        if (date == null) return "Chưa xác định";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return date.format(formatter);
    }
}