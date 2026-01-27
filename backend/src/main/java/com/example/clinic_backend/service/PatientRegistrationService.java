package com.example.clinic_backend.service;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class PatientRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(PatientRegistrationService.class);
    
    private final PatientRegistrationRepository repository;
    private final AutoApprovalService autoApprovalService;
    private final EmailService emailService;
    
    @Autowired
    private DoctorSlotService doctorSlotService;

    @Autowired
    private WebSocketService webSocketService;

    // Thêm constant
    private static final int MAX_PATIENTS_PER_SLOT = 10;

    public PatientRegistrationService(PatientRegistrationRepository repository,
                                    AutoApprovalService autoApprovalService,
                                    EmailService emailService) {
        this.repository = repository;
        this.autoApprovalService = autoApprovalService;
        this.emailService = emailService;
    }

    public List<PatientRegistration> getAll() {
        log.debug("🔄 Lấy tất cả đơn đăng ký");
        return repository.findAll();
    }

    public List<PatientRegistration> getAllWithDoctor() {
        log.debug("🔍 Lấy tất cả đơn đăng ký với thông tin bác sĩ");
        List<PatientRegistration> result = repository.findAllWithDoctor();
        log.info("✅ Đã tìm thấy {} đơn đăng ký với thông tin bác sĩ", result.size());
        return result;
    }

    public Optional<PatientRegistration> getById(Long id) {
        log.debug("🔍 Tìm đơn đăng ký với ID: {}", id);
        return repository.findById(id);
    }

    public List<PatientRegistration> getByEmail(String email) {
        try {
            log.info("🔄 Đang tìm lịch hẹn với thông tin bác sĩ cho email: {}", email);
            
            List<PatientRegistration> result = repository.findByEmailWithDoctor(email);
            
            if (!result.isEmpty()) {
                log.info("✅ Đã tìm thấy {} lịch hẹn với thông tin bác sĩ", result.size());
                return result;
            }
            
            log.debug("⚠️ Không có kết quả với join, thử truy vấn thông thường");
            result = repository.findByEmail(email);
            log.info("✅ Đã tìm thấy {} lịch hẹn bằng truy vấn thông thường", result.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ Truy vấn với join thất bại: {}", e.getMessage(), e);
            return repository.findByEmail(email);
        }
    }

    @Transactional
    public PatientRegistration createRegistration(PatientRegistration registration) {
        log.info("🔵 Bắt đầu quy trình đăng ký cho: {}", registration.getFullName());
        log.info("   - Email: {}", registration.getEmail());
        log.info("   - Phone: {}", registration.getPhone());
        log.info("   - Department: {}", registration.getDepartment());
        log.info("   - Doctor ID: {}", registration.getDoctorId());
        log.info("   - Time Slot: {}", registration.getAssignedSession());
        
        try {
            // TRƯỜNG HỢP 1: Không chọn bác sĩ
            if (registration.getDoctorId() == null) {
                log.info("⚡ Không chọn bác sĩ - đánh dấu cần xử lý thủ công");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                
                // ĐẢM BẢO CÓ REGISTRATION NUMBER
                if (registration.getRegistrationNumber() == null || registration.getRegistrationNumber().isEmpty()) {
                    registration.setRegistrationNumber(generateRegistrationNumber());
                }
                
                PatientRegistration savedRegistration = repository.save(registration);
                log.info("✅ Đã lưu đơn đăng ký không có bác sĩ: ID={}", savedRegistration.getId());
                
                // Gửi thông báo qua WebSocket (async)
                sendWebSocketNotification(savedRegistration);
                
                return savedRegistration;
            }
            
            // TRƯỜNG HỢP 2: Có chọn bác sĩ, kiểm tra slot
            if (registration.getAssignedSession() != null) {
                boolean slotAvailable = checkAvailableSlots(
                    registration.getDoctorId(),
                    registration.getAppointmentDate(),
                    registration.getAssignedSession()
                );
                
                if (!slotAvailable) {
                    log.info("⏳ Không có slot khả dụng, đánh dấu cần xử lý thủ công");
                    registration.setStatus("NEEDS_MANUAL_REVIEW");
                    
                    // ĐẢM BẢO CÓ REGISTRATION NUMBER
                    if (registration.getRegistrationNumber() == null || registration.getRegistrationNumber().isEmpty()) {
                        registration.setRegistrationNumber(generateRegistrationNumber());
                    }
                    
                    PatientRegistration savedRegistration = repository.save(registration);
                    log.info("✅ Đã lưu đơn đăng ký (slot đầy): ID={}", savedRegistration.getId());
                    
                    // Gửi thông báo qua WebSocket (async)
                    sendWebSocketNotification(savedRegistration);
                    
                    return savedRegistration;
                }
            }
            
            // TRƯỜNG HỢP 3: Có slot khả dụng, xử lý tự động
            log.info("🔄 Xử lý đăng ký tự động...");
            PatientRegistration processedRegistration = autoApprovalService.processNewRegistration(registration);
            
            // ĐẢM BẢO CÓ REGISTRATION NUMBER
            if (processedRegistration.getRegistrationNumber() == null || 
                processedRegistration.getRegistrationNumber().isEmpty()) {
                processedRegistration.setRegistrationNumber(generateRegistrationNumber());
                processedRegistration = repository.save(processedRegistration);
            }
            
            log.info("✅ Quá trình đăng ký hoàn tất! ID={}, Status={}", 
                processedRegistration.getId(), processedRegistration.getStatus());
            
            // Gửi thông báo qua WebSocket (async)
            sendWebSocketNotification(processedRegistration);
            
            return processedRegistration;
            
        } catch (Exception e) {
            log.error("❌ Lỗi khi xử lý đăng ký: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi xử lý đăng ký: " + e.getMessage(), e);
        }
    }
    
    private void sendWebSocketNotification(PatientRegistration registration) {
        new Thread(() -> {
            try {
                Thread.sleep(1000); // Delay 1 giây để đảm bảo transaction committed
                webSocketService.notifyNewAppointment(registration);
                log.info("📢 Đã gửi thông báo WebSocket cho đơn đăng ký: ID={}", registration.getId());
            } catch (Exception e) {
                log.error("❌ Lỗi khi gửi thông báo WebSocket: {}", e.getMessage());
            }
        }).start();
    }

    public List<PatientRegistration> getRegistrationsNeedingManualReview() {
        log.debug("🔍 Lấy các đơn đăng ký cần xử lý thủ công");
        return repository.findByStatusOrderByCreatedAtAsc("NEEDS_MANUAL_REVIEW");
    }

    @Transactional
    public PatientRegistration tryApproveRegistration(Long registrationId) {
        log.info("🔄 Thử duyệt thủ công đơn đăng ký ID: {}", registrationId);
        
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            log.error("❌ Không tìm thấy đơn đăng ký với ID: {}", registrationId);
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        // Kiểm tra slot nếu có bác sĩ
        if (registration.getDoctorId() != null && registration.getAssignedSession() != null) {
            boolean hasSlot = checkAvailableSlots(
                registration.getDoctorId(),
                registration.getAppointmentDate(),
                registration.getAssignedSession()
            );

            if (!hasSlot) {
                log.error("❌ Không có slot khả dụng cho doctorId={}, date={}, session={}", 
                    registration.getDoctorId(), registration.getAppointmentDate(), registration.getAssignedSession());
                throw new RuntimeException("Không có slot khả dụng cho buổi khám này");
            }
        }
        
        log.info("🔄 Duyệt thủ công - Gọi AutoApprovalService xử lý");
        PatientRegistration approvedRegistration = autoApprovalService.autoApproveRegistration(
            registration, 
            registration.getAssignedSession()
        );
        
        if ("APPROVED".equals(approvedRegistration.getStatus())) {
            try {
                emailService.sendApprovalEmail(approvedRegistration);
                log.info("📧 Đã gửi email duyệt đơn cho: {}", approvedRegistration.getEmail());
            } catch (Exception e) {
                log.error("❌ Lỗi gửi email duyệt đơn: {}", e.getMessage());
                // Không throw exception vì đơn vẫn được duyệt thành công
            }
        }
        
        log.info("✅ Đã duyệt đơn thành công: ID={}, Status={}", 
            approvedRegistration.getId(), approvedRegistration.getStatus());
        
        return approvedRegistration;
    }

    @Transactional
    public PatientRegistration rejectRegistration(Long registrationId, String reason) {
        log.info("🔄 Từ chối đơn đăng ký ID: {}, Lý do: {}", 
            registrationId, (reason != null ? reason : "Không có lý do"));
        
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            log.error("❌ Không tìm thấy đơn đăng ký với ID: {}", registrationId);
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        registration.setStatus("REJECTED");
        
        log.info("✅ Đã từ chối đơn đăng ký: ID={}", registrationId);
        return repository.save(registration);
    }

    @Transactional
    public PatientRegistration processPaymentSuccess(Long registrationId, String transactionNumber, BigDecimal amount) {
        log.info("💳 Xử lý thanh toán thành công: ID={}, Transaction={}, Amount={}", 
            registrationId, transactionNumber, amount);
        
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            log.error("❌ Không tìm thấy đơn đăng ký với ID: {}", registrationId);
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        registration.setPaymentStatus("PAID");
        registration.setTransactionNumber(transactionNumber);
        registration.setPaidAmount(amount != null ? amount : BigDecimal.ZERO);
        registration.setPaidAt(LocalDateTime.now());

        PatientRegistration savedRegistration = repository.save(registration);
        log.info("✅ Đã cập nhật trạng thái thanh toán: ID={}", registrationId);

        try {
            emailService.sendPaymentSuccessEmail(savedRegistration);
            log.info("📧 Đã gửi email thanh toán thành công cho: {}", savedRegistration.getEmail());
        } catch (Exception e) {
            log.error("❌ Lỗi gửi email thanh toán: {}", e.getMessage());
            // Không throw exception vì thanh toán đã được xử lý thành công
        }

        return savedRegistration;
    }

    @Transactional
    public PatientRegistration processPaymentSuccess(Long registrationId, String transactionNumber, Double amount) {
        BigDecimal bigDecimalAmount = amount != null ? BigDecimal.valueOf(amount) : BigDecimal.ZERO;
        return processPaymentSuccess(registrationId, transactionNumber, bigDecimalAmount);
    }

    public boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String assignedSession) {
        try {
            log.debug("🔍 Kiểm tra slot khả dụng:");
            log.debug("   - ID Bác sĩ: {}", doctorId);
            log.debug("   - Ngày: {}", appointmentDate);
            log.debug("   - Buổi: {}", assignedSession);
            
            if (doctorId == null || appointmentDate == null || assignedSession == null) {
                log.warn("⚠️ Thiếu tham số bắt buộc để kiểm tra slot");
                return false;
            }
            
            Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, "APPROVED"
            );
            
            if (approvedCount == null) {
                approvedCount = 0;
            }
            
            log.debug("✅ Kiểm tra slot - {}: {}/{} đơn đã được duyệt", 
                assignedSession, approvedCount, MAX_PATIENTS_PER_SLOT);
            
            boolean available = approvedCount < MAX_PATIENTS_PER_SLOT;
            log.debug("   → Slot khả dụng: {}", available);
            
            return available;
            
        } catch (Exception e) {
            log.error("❌ Lỗi khi kiểm tra slot khả dụng: {}", e.getMessage(), e);
            return false;
        }
    }

    public Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        Long doctorId, LocalDate appointmentDate, String assignedSession, String status) {
        
        log.debug("🔍 Đang đếm đơn đăng ký:");
        log.debug("   - ID Bác sĩ: {}", doctorId);
        log.debug("   - Ngày: {}", appointmentDate);
        log.debug("   - Buổi: {}", assignedSession);
        log.debug("   - Trạng thái: {}", status);
        
        try {
            Integer count = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, status
            );
            
            log.debug("✅ Kết quả đếm: {}", count);
            return count != null ? count : 0;
            
        } catch (Exception e) {
            log.error("❌ Lỗi khi đếm đơn đăng ký: {}", e.getMessage(), e);
            return 0;
        }
    }

    public PatientRegistration save(PatientRegistration registration) {
        log.debug("💾 Lưu đơn đăng ký: ID={}", registration.getId());
        return repository.save(registration);
    }

    public PatientRegistration update(PatientRegistration registration) {
        log.debug("🔄 Cập nhật đơn đăng ký: ID={}", registration.getId());
        return repository.save(registration);
    }

    public void deleteById(Long id) {
        log.info("🗑️ Xóa đơn đăng ký: ID={}", id);
        repository.deleteById(id);
        log.info("✅ Đã xóa đơn đăng ký: ID={}", id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public List<PatientRegistration> getByPhone(String phone) {
        log.debug("🔍 Tìm đơn đăng ký theo số điện thoại: {}", phone);
        return repository.findByPhone(phone);
    }

    public List<PatientRegistration> getByStatus(String status) {
        log.debug("🔍 Tìm đơn đăng ký theo trạng thái: {}", status);
        return repository.findByStatus(status);
    }

    private String generateRegistrationNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int)(Math.random() * 1000));
        return "REG-" + timestamp.substring(timestamp.length() - 8) + "-" + random;
    }
    
    public Map<String, Object> getRegistrationStatistics() {
        log.info("📊 Tính toán thống kê đăng ký");
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            List<PatientRegistration> allRegistrations = repository.findAll();
            int totalAppointments = allRegistrations.size();
            int paidCount = 0;
            int unpaidCount = 0;
            int pendingCount = 0;
            
            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal paidRevenue = BigDecimal.ZERO;
            BigDecimal pendingRevenue = BigDecimal.ZERO;
            
            for (PatientRegistration registration : allRegistrations) {
                if (registration.getPaymentStatus() != null) {
                    switch (registration.getPaymentStatus()) {
                        case "PAID":
                            paidCount++;
                            if (registration.getPaidAmount() != null) {
                                paidRevenue = paidRevenue.add(registration.getPaidAmount());
                                totalRevenue = totalRevenue.add(registration.getPaidAmount());
                            }
                            break;
                        case "PENDING":
                            pendingCount++;
                            if (registration.getExaminationFee() != null) {
                                pendingRevenue = pendingRevenue.add(registration.getExaminationFee());
                            }
                            break;
                        default:
                            unpaidCount++;
                            break;
                    }
                } else {
                    unpaidCount++;
                }
            }
            
            double paidRate = totalAppointments > 0 ? (paidCount * 100.0 / totalAppointments) : 0;
            double unpaidRate = totalAppointments > 0 ? (unpaidCount * 100.0 / totalAppointments) : 0;
            double pendingRate = totalAppointments > 0 ? (pendingCount * 100.0 / totalAppointments) : 0;
            Map<String, Object> dailyStats = getDailyRegistrationStats(7);
            Map<String, Long> examStatusStats = new HashMap<>();
            allRegistrations.stream()
                .filter(r -> r.getExaminationStatus() != null)
                .forEach(r -> {
                    examStatusStats.put(r.getExaminationStatus(), 
                        examStatusStats.getOrDefault(r.getExaminationStatus(), 0L) + 1);
                });
            
            Map<String, Long> departmentStats = new HashMap<>();
            allRegistrations.stream()
                .filter(r -> r.getDepartment() != null)
                .forEach(r -> {
                    departmentStats.put(r.getDepartment(), 
                        departmentStats.getOrDefault(r.getDepartment(), 0L) + 1);
                });
            
            statistics.put("success", true);
            statistics.put("totalAppointments", totalAppointments);
            statistics.put("paidCount", paidCount);
            statistics.put("unpaidCount", unpaidCount);
            statistics.put("pendingCount", pendingCount);
            statistics.put("paidRate", Math.round(paidRate * 100.0) / 100.0);
            statistics.put("unpaidRate", Math.round(unpaidRate * 100.0) / 100.0);
            statistics.put("pendingRate", Math.round(pendingRate * 100.0) / 100.0);
            statistics.put("totalRevenue", totalRevenue);
            statistics.put("paidRevenue", paidRevenue);
            statistics.put("pendingRevenue", pendingRevenue);
            statistics.put("dailyStats", dailyStats);
            statistics.put("examStatusStats", examStatusStats);
            statistics.put("departmentStats", departmentStats);
            statistics.put("lastUpdated", LocalDateTime.now().toString());
            
            log.info("✅ Đã tính toán thống kê thành công: {} appointments", totalAppointments);
            
        } catch (Exception e) {
            log.error("❌ Lỗi tính thống kê đăng ký: {}", e.getMessage(), e);
            statistics.put("success", false);
            statistics.put("error", "Không thể tính thống kê đăng ký");
        }
        
        return statistics;
    }
    
    private Map<String, Object> getDailyRegistrationStats(int days) {
        Map<String, Object> dailyStats = new HashMap<>();
        List<Map<String, Object>> dailyData = new ArrayList<>();
        
        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            List<PatientRegistration> allRegistrations = repository.findAll();
            
            for (int i = 0; i < days; i++) {
                LocalDate currentDate = startDate.plusDays(i);
                String dateKey = currentDate.toString();
                
                List<PatientRegistration> dailyRegistrations = new ArrayList<>();
                for (PatientRegistration r : allRegistrations) {
                    if (r.getAppointmentDate() != null) {
                        LocalDate appointmentDate = r.getAppointmentDate();
                        if (appointmentDate.equals(currentDate)) {
                            dailyRegistrations.add(r);
                        }
                    }
                }
                
                int dailyTotal = dailyRegistrations.size();
                int dailyPaid = 0;
                int dailyPending = 0;
                
                for (PatientRegistration r : dailyRegistrations) {
                    if ("PAID".equals(r.getPaymentStatus())) {
                        dailyPaid++;
                    } else if ("PENDING".equals(r.getPaymentStatus())) {
                        dailyPending++;
                    }
                }
                
                BigDecimal dailyRevenue = BigDecimal.ZERO;
                for (PatientRegistration r : dailyRegistrations) {
                    if ("PAID".equals(r.getPaymentStatus()) && r.getPaidAmount() != null) {
                        dailyRevenue = dailyRevenue.add(r.getPaidAmount());
                    }
                }
                
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("date", dateKey);
                dayData.put("total", dailyTotal);
                dayData.put("paid", dailyPaid);
                dayData.put("pending", dailyPending);
                dayData.put("revenue", dailyRevenue);
                
                dailyData.add(dayData);
            }
            
            dailyStats.put("days", days);
            dailyStats.put("startDate", startDate.toString());
            dailyStats.put("endDate", endDate.toString());
            dailyStats.put("data", dailyData);
            
        } catch (Exception e) {
            log.error("❌ Lỗi lấy thống kê hàng ngày: {}", e.getMessage(), e);
        }
        
        return dailyStats;
    }
    
    public List<PatientRegistration> getRegistrationsByPaymentStatus(String paymentStatus) {
        log.debug("🔍 Tìm đơn đăng ký theo trạng thái thanh toán: {}", paymentStatus);
        return repository.findByPaymentStatus(paymentStatus);
    }
    

    public Map<String, Object> getRevenueStatistics(LocalDate startDate, LocalDate endDate) {
        log.info("💰 Tính toán thống kê doanh thu từ {} đến {}", startDate, endDate);
        Map<String, Object> revenueStats = new HashMap<>();
        
        try {
            List<PatientRegistration> registrations = repository.findAll();
            
            List<PatientRegistration> filteredRegistrations = new ArrayList<>();
            for (PatientRegistration r : registrations) {
                if (r.getAppointmentDate() != null) {
                    LocalDate appointmentDate = r.getAppointmentDate();
                    
                    if (!appointmentDate.isBefore(startDate) && !appointmentDate.isAfter(endDate)) {
                        filteredRegistrations.add(r);
                    }
                }
            }
            
            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal paidRevenue = BigDecimal.ZERO;
            BigDecimal expectedRevenue = BigDecimal.ZERO;
            
            int paidCount = 0;
            int pendingCount = 0;
            
            for (PatientRegistration r : filteredRegistrations) {
                if ("PAID".equals(r.getPaymentStatus()) && r.getPaidAmount() != null) {
                    paidCount++;
                    paidRevenue = paidRevenue.add(r.getPaidAmount());
                    totalRevenue = totalRevenue.add(r.getPaidAmount());
                } else if ("PENDING".equals(r.getPaymentStatus()) && r.getExaminationFee() != null) {
                    pendingCount++;
                    expectedRevenue = expectedRevenue.add(r.getExaminationFee());
                }
            }
            
            revenueStats.put("success", true);
            revenueStats.put("startDate", startDate.toString());
            revenueStats.put("endDate", endDate.toString());
            revenueStats.put("totalRegistrations", filteredRegistrations.size());
            revenueStats.put("paidCount", paidCount);
            revenueStats.put("pendingCount", pendingCount);
            revenueStats.put("totalRevenue", totalRevenue);
            revenueStats.put("paidRevenue", paidRevenue);
            revenueStats.put("expectedRevenue", expectedRevenue);
            revenueStats.put("collectionRate", 
                filteredRegistrations.size() > 0 ? 
                (paidCount * 100.0 / filteredRegistrations.size()) : 0);
            
            log.info("✅ Đã tính toán thống kê doanh thu: {} registrations, {} VND", 
                filteredRegistrations.size(), totalRevenue);
            
        } catch (Exception e) {
            log.error("❌ Lỗi tính thống kê doanh thu: {}", e.getMessage(), e);
            revenueStats.put("success", false);
            revenueStats.put("error", "Không thể tính thống kê doanh thu");
        }
        
        return revenueStats;
    }
}