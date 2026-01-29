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
import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    // Màu sắc cho email
    private static final String PRIMARY_COLOR = "#1E88E5";
    private static final String PRIMARY_LIGHT = "#64B5F6";
    private static final String PRIMARY_DARK = "#1565C0";
    private static final String SECONDARY_COLOR = "#4CAF50";
    private static final String WARNING_COLOR = "#FF9800";
    private static final String DANGER_COLOR = "#dc2626";
    
    // Thời gian gửi email tự động
    private static final String REMINDER_START_TIME = "00:00";
    private static final String REMINDER_END_TIME = "23:59";

    // Biến để tránh gửi trùng lặp
    private final AtomicBoolean isSendingReminders = new AtomicBoolean(false);

    // Gửi email khi đơn được duyệt
    public void sendApprovalEmail(PatientRegistration appointment) {
        try {
            // Kiểm tra email
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

    // Gửi email khi thanh toán thành công
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

    // Gửi email nhắc lịch tự động
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

    // Gửi email thông báo hủy lịch hẹn
    public void sendCancellationEmail(PatientRegistration appointment, String reason) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Không có email cho đơn: {}", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("Xác nhận hủy lịch hẹn - " + appointment.getRegistrationNumber());
            
            String emailContent = buildCancellationEmailContent(appointment, reason);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("Đã gửi email hủy lịch cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("Lỗi gửi email hủy lịch: {}", e.getMessage());
        }
    }

    // Gửi email thông báo hoàn tiền đã xử lý
    public void sendRefundProcessedEmail(PatientRegistration appointment) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Không có email cho đơn: {}", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("Hoàn tiền thành công - " + appointment.getRegistrationNumber());
            
            String emailContent = buildRefundProcessedEmailContent(appointment);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("Đã gửi email hoàn tiền cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("Lỗi gửi email hoàn tiền: {}", e.getMessage());
        }
    }

    // Gửi email thông báo từ chối hoàn tiền
    public void sendRefundRejectedEmail(PatientRegistration appointment, String reason) {
        try {
            if (appointment.getEmail() == null || appointment.getEmail().trim().isEmpty()) {
                logger.warn("Không có email cho đơn: {}", appointment.getRegistrationNumber());
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("Thông báo về yêu cầu hoàn tiền - " + appointment.getRegistrationNumber());
            
            String emailContent = buildRefundRejectedEmailContent(appointment, reason);
            helper.setText(emailContent, true);

            mailSender.send(message);
            logger.info("Đã gửi email từ chối hoàn tiền cho: {}", appointment.getEmail());

        } catch (Exception e) {
            logger.error("Lỗi gửi email từ chối hoàn tiền: {}", e.getMessage());
        }
    }

    // Cập nhật trạng thái đã gửi reminder
    private void updateReminderSentStatus(PatientRegistration appointment) {
        try {
            appointment.setReminderSent(true);
            appointment.setLastReminderSentAt(LocalDateTime.now());
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
            .append("<p><strong>Hotline hỗ trợ:</strong> 1900 1234</p>")
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
            .append("<h3 style='color: ").append(SECONDARY_COLOR).append("; margin: 0;'>Thanh toán thành công!</h3>")
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
            .append("<h4 style='color: #e65100; margin-top: 0;'>Lưu ý quan trọng</h4>")
            .append("<ul style='margin: 10px 0; padding-left: 20px;'>")
            .append("<li>Vui lòng đến trước <strong>15 phút</strong> để làm thủ tục</li>")
            .append("<li>Mang theo <strong>CMND/CCCD</strong> và thẻ <strong>BHYT</strong> (nếu có)</li>")
            .append("<li>Mang theo các kết quả xét nghiệm, chẩn đoán hình ảnh cũ (nếu có)</li>")
            .append("</ul>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>Hotline hỗ trợ:</strong> 1900 1234</p>")
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
            .append(".reminder-badge { background: #fff3e0; color: #e65100; padding: 12px 25px; border-radius: 25px; font-weight: bold; display: inline-block; margin-bottom: 15px; border: 2px solid ").append(WARNING_COLOR).append("; }")
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
            .append("<p><strong>Hotline hỗ trợ:</strong> 1900 1234</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div>")
            .append("</div>")
            .append("</div></body></html>");

        return html.toString();
    }

    // Tạo nội dung email hủy lịch
    private String buildCancellationEmailContent(PatientRegistration appointment, String reason) {
        String appointmentDate = formatDate(appointment.getAppointmentDate());
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";
        String department = appointment.getDepartment() != null ? 
            appointment.getDepartment() : "N/A";
        String cancelledAt = formatDateTime(appointment.getCancelledAt());
        
        // Thông tin hoàn tiền
        String refundAmount = appointment.getRefundAmount() != null ? 
            String.format("%,d", appointment.getRefundAmount().intValue()) : "0";
        String refundStatus = appointment.getRefundStatus();

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }")
            .append(".container { max-width: 600px; margin: auto; background: white; }")
            .append(".header { background: ").append(DANGER_COLOR).append("; color: white; padding: 25px; text-align: center; }")
            .append(".hospital-name { font-size: 18px; margin-top: 5px; opacity: 0.9; }")
            .append(".content { padding: 20px; background: #f8f9fa; }")
            .append(".info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ").append(DANGER_COLOR).append("; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
            .append(".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 15px; background: #f0f0f0; }")
            .append(".warning-box { background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ").append(DANGER_COLOR).append("; }")
            .append(".refund-box { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ").append(SECONDARY_COLOR).append("; }")
            .append(".status-badge { background: #ffcdd2; color: ").append(DANGER_COLOR).append("; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 10px; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'>")
            .append("<h2 style='margin: 0;'>XÁC NHẬN HỦY LỊCH HẸN</h2>")
            .append("<div class='hospital-name'>Bệnh Viện Đại Học Y Dược Tp.HCM</div>")
            .append("</div>")
            .append("<div class='content'>")
            .append("<div class='info-card'>")
            .append("<div style='text-align: center;'>")
            .append("<span class='status-badge'>ĐÃ HỦY</span>")
            .append("</div>")
            .append("<h3 style='color: ").append(DANGER_COLOR).append("; margin-top: 0;'>Kính gửi: ").append(appointment.getFullName()).append("</h3>")
            .append("<p>Lịch hẹn khám của bạn đã được hủy thành công.</p>")
            .append("<div style='background: #ffebee; padding: 15px; border-radius: 5px;'>")
            .append("<h4 style='color: ").append(DANGER_COLOR).append("; margin-top: 0;'>Thông tin lịch hẹn đã hủy</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Ngày khám:</strong> ").append(appointmentDate).append("</p>")
            .append("<p><strong>Khoa khám:</strong> ").append(department).append("</p>")
            .append("<p><strong>Lý do hủy:</strong> ").append(reason).append("</p>")
            .append("<p><strong>Thời gian hủy:</strong> ").append(cancelledAt).append("</p>")
            .append("</div>");
        
        // Hiển thị thông tin hoàn tiền nếu có
        if ("REQUESTED".equals(refundStatus) || "PROCESSED".equals(refundStatus)) {
            html.append("<div class='refund-box'>")
                .append("<h4 style='color: #388e3c; margin-top: 0;'>Thông tin hoàn tiền</h4>")
                .append("<p><strong>Trạng thái:</strong> ");
            
            if ("REQUESTED".equals(refundStatus)) {
                html.append("<span style='color: ").append(WARNING_COLOR).append(";'>ĐANG CHỜ XỬ LÝ</span></p>");
            } else if ("PROCESSED".equals(refundStatus)) {
                html.append("<span style='color: ").append(SECONDARY_COLOR).append(";'>ĐÃ XỬ LÝ</span></p>");
            }
            
            html.append("<p><strong>Số tiền hoàn:</strong> <span style='font-size: 18px; color: #d32f2f; font-weight: bold;'>")
                .append(refundAmount).append(" VND</span></p>")
                .append("<p>Yêu cầu hoàn tiền sẽ được xử lý trong vòng 3-5 ngày làm việc.</p>")
                .append("</div>");
        }
        
        html.append("</div>")
            .append("<div class='warning-box'>")
            .append("<h4 style='color: ").append("#e65100").append("; margin-top: 0;'>Lưu ý quan trọng</h4>")
            .append("<ul style='margin: 10px 0; padding-left: 20px;'>")
            .append("<li>Lịch hẹn đã hủy không thể khôi phục</li>")
            .append("<li>Nếu có nhu cầu khám lại, vui lòng đặt lịch mới</li>")
            .append("<li>Liên hệ hotline nếu cần hỗ trợ thêm</li>")
            .append("</ul>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>Hotline hỗ trợ:</strong> 1900 1234</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div>")
            .append("</div>")
            .append("</div></body></html>");

        return html.toString();
    }

    // Tạo nội dung email hoàn tiền đã xử lý
    private String buildRefundProcessedEmailContent(PatientRegistration appointment) {
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";
        String refundAmount = appointment.getRefundAmount() != null ? 
            String.format("%,d", appointment.getRefundAmount().intValue()) : "0";
        String processedAt = formatDateTime(appointment.getRefundProcessedAt());

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }")
            .append(".container { max-width: 600px; margin: auto; background: white; }")
            .append(".header { background: ").append(SECONDARY_COLOR).append("; color: white; padding: 25px; text-align: center; }")
            .append(".hospital-name { font-size: 18px; margin-top: 5px; opacity: 0.9; }")
            .append(".content { padding: 20px; background: #f8f9fa; }")
            .append(".info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ").append(SECONDARY_COLOR).append("; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
            .append(".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 15px; background: #f0f0f0; }")
            .append(".success-box { background: #e8f5e9; padding: 25px; text-align: center; border-radius: 5px; margin: 15px 0; border: 2px solid ").append(SECONDARY_COLOR).append("; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'>")
            .append("<h2 style='margin: 0;'>HOÀN TIỀN THÀNH CÔNG</h2>")
            .append("<div class='hospital-name'>Bệnh Viện Đại Học Y Dược Tp.HCM</div>")
            .append("</div>")
            .append("<div class='content'>")
            .append("<div class='success-box'>")
            .append("<h3 style='color: ").append(SECONDARY_COLOR).append("; margin: 0;'>Hoàn tiền thành công!</h3>")
            .append("<p style='margin: 10px 0 0 0;'>Yêu cầu hoàn tiền của bạn đã được xử lý</p>")
            .append("</div>")
            .append("<div class='info-card'>")
            .append("<h3 style='color: ").append(PRIMARY_COLOR).append("; margin-top: 0;'>Kính gửi: ").append(appointment.getFullName()).append("</h3>")
            .append("<p>Yêu cầu hoàn tiền cho lịch hẹn của bạn đã được xử lý thành công.</p>")
            .append("<div style='background: #e8f5e9; padding: 15px; border-radius: 5px;'>")
            .append("<h4 style='color: #388e3c; margin-top: 0;'>Thông tin hoàn tiền</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Số tiền hoàn:</strong> <span style='font-size: 18px; color: #d32f2f; font-weight: bold;'>")
            .append(refundAmount).append(" VND</span></p>")
            .append("<p><strong>Thời gian xử lý:</strong> ").append(processedAt).append("</p>")
            .append("<p><strong>Trạng thái:</strong> <span style='color: ").append(SECONDARY_COLOR).append("; font-weight: bold;'>ĐÃ HOÀN THÀNH</span></p>")
            .append("</div>")
            .append("<p style='margin-top: 15px; color: #666;'>Số tiền đã được chuyển vào tài khoản của bạn theo thông tin bạn cung cấp.</p>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>Hotline hỗ trợ:</strong> 1900 1234</p>")
            .append("<p>Đây là email tự động, vui lòng không trả lời.</p>")
            .append("</div>")
            .append("</div>")
            .append("</div></body></html>");

        return html.toString();
    }

    // Tạo nội dung email từ chối hoàn tiền
    private String buildRefundRejectedEmailContent(PatientRegistration appointment, String reason) {
        String registrationNumber = appointment.getRegistrationNumber() != null ? 
            appointment.getRegistrationNumber() : "N/A";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
            .append("<style>")
            .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }")
            .append(".container { max-width: 600px; margin: auto; background: white; }")
            .append(".header { background: ").append(DANGER_COLOR).append("; color: white; padding: 25px; text-align: center; }")
            .append(".hospital-name { font-size: 18px; margin-top: 5px; opacity: 0.9; }")
            .append(".content { padding: 20px; background: #f8f9fa; }")
            .append(".info-card { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid ").append(DANGER_COLOR).append("; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
            .append(".footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 15px; background: #f0f0f0; }")
            .append(".rejection-box { background: #ffebee; padding: 25px; text-align: center; border-radius: 5px; margin: 15px 0; border: 2px solid ").append(DANGER_COLOR).append("; }")
            .append("</style></head><body>")
            .append("<div class='container'>")
            .append("<div class='header'>")
            .append("<h2 style='margin: 0;'>THÔNG BÁO VỀ YÊU CẦU HOÀN TIỀN</h2>")
            .append("<div class='hospital-name'>Bệnh Viện Đại Học Y Dược Tp.HCM</div>")
            .append("</div>")
            .append("<div class='content'>")
            .append("<div class='rejection-box'>")
            .append("<h3 style='color: ").append(DANGER_COLOR).append("; margin: 0;'>Yêu cầu hoàn tiền đã bị từ chối</h3>")
            .append("<p style='margin: 10px 0 0 0;'>Rất tiếc, yêu cầu hoàn tiền của bạn không được chấp nhận</p>")
            .append("</div>")
            .append("<div class='info-card'>")
            .append("<h3 style='color: ").append(PRIMARY_COLOR).append("; margin-top: 0;'>Kính gửi: ").append(appointment.getFullName()).append("</h3>")
            .append("<p>Yêu cầu hoàn tiền cho lịch hẹn của bạn đã bị từ chối.</p>")
            .append("<div style='background: #ffebee; padding: 15px; border-radius: 5px;'>")
            .append("<h4 style='color: ").append(DANGER_COLOR).append("; margin-top: 0;'>Thông tin từ chối</h4>")
            .append("<p><strong>Mã đơn:</strong> ").append(registrationNumber).append("</p>")
            .append("<p><strong>Lý do từ chối:</strong> ").append(reason).append("</p>")
            .append("<p><strong>Trạng thái:</strong> <span style='color: ").append(DANGER_COLOR).append("; font-weight: bold;'>ĐÃ TỪ CHỐI</span></p>")
            .append("</div>")
            .append("<p style='margin-top: 15px; color: #666;'>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline hỗ trợ.</p>")
            .append("</div>")
            .append("<div class='footer'>")
            .append("<p><strong>Hotline hỗ trợ:</strong> 1900 1234</p>")
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