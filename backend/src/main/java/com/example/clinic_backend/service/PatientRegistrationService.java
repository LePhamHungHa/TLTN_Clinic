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

@Service
@Transactional
public class PatientRegistrationService {

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

    // ========== CÁC METHOD HIỆN CÓ - GIỮ NGUYÊN ==========
    
    public List<PatientRegistration> getAll() {
        return repository.findAll();
    }

    public List<PatientRegistration> getAllWithDoctor() {
        System.out.println("🔍 Service - Lấy tất cả đơn đăng ký với thông tin bác sĩ");
        List<PatientRegistration> result = repository.findAllWithDoctor();
        System.out.println("✅ Service - Đã tìm thấy " + result.size() + " đơn đăng ký với thông tin bác sĩ");
        return result;
    }

    public Optional<PatientRegistration> getById(Long id) {
        return repository.findById(id);
    }

    public List<PatientRegistration> getByEmail(String email) {
        try {
            System.out.println("🔄 Đang tìm lịch hẹn với thông tin bác sĩ cho email: " + email);
            
            // 🔥 SỬA: Dùng method mới có JOIN FETCH để lấy thông tin bác sĩ
            List<PatientRegistration> result = repository.findByEmailWithDoctor(email);
            
            if (!result.isEmpty()) {
                System.out.println("✅ Đã tìm thấy " + result.size() + " lịch hẹn với thông tin bác sĩ");
                
                // DEBUG: In thông tin bác sĩ để kiểm tra
                result.forEach(appointment -> {
                    if (appointment.getDoctor() != null) {
                        System.out.println("👨‍⚕️ Bác sĩ: " + appointment.getDoctor().getFullName() + 
                                         " - Bằng cấp: " + appointment.getDoctor().getDegree() +
                                         " - Chức vụ: " + appointment.getDoctor().getPosition());
                    } else {
                        System.out.println("❌ Không có thông tin bác sĩ cho appointment ID: " + appointment.getId() +
                                         ", Doctor ID: " + appointment.getDoctorId());
                    }
                });
                return result;
            }
            
            // FALLBACK: nếu không có kết quả, dùng method cũ
            System.out.println("🔄 Không có kết quả với join, thử truy vấn thông thường");
            result = repository.findByEmail(email);
            System.out.println("✅ Đã tìm thấy " + result.size() + " lịch hẹn bằng truy vấn thông thường");
            return result;
            
        } catch (Exception e) {
            System.out.println("❌ Truy vấn với join thất bại: " + e.getMessage());
            e.printStackTrace();
            // FALLBACK: dùng method cũ nếu có lỗi
            return repository.findByEmail(email);
        }
    }

    @Transactional
    public PatientRegistration createRegistration(PatientRegistration registration) {
        System.out.println("🚀 Bắt đầu quy trình đăng ký cho: " + registration.getFullName());
        System.out.println("📋 Thông tin chi tiết ban đầu:");
        System.out.println("   - ID Bác sĩ: " + registration.getDoctorId());
        System.out.println("   - Buổi khám: " + registration.getAssignedSession());
        System.out.println("   - Trạng thái ban đầu: " + registration.getStatus());
        
        // QUAN TRỌNG: Nếu không có doctorId, không cần kiểm tra slot
        if (registration.getDoctorId() == null) {
            System.out.println("⚠️ Không chọn bác sĩ - đánh dấu cần xử lý thủ công");
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            registration.setRegistrationNumber(generateRegistrationNumber());
            
            PatientRegistration savedRegistration = repository.save(registration);
            
            // GỬI THÔNG BÁO REAL-TIME - THÊM TRỄ 1 GIÂY
            new Thread(() -> {
                try {
                    Thread.sleep(1000);
                    webSocketService.notifyNewAppointment(savedRegistration);
                    System.out.println("🔔 Đã gửi thông báo cho đơn đăng ký: " + savedRegistration.getId());
                } catch (Exception e) {
                    System.err.println("❌ Lỗi khi gửi thông báo: " + e.getMessage());
                }
            }).start();
            
            return savedRegistration;
        }
        
        // Chỉ kiểm tra slot nếu có doctorId VÀ assignedSession
        if (registration.getAssignedSession() != null) {
            boolean slotAvailable = checkAvailableSlots(
                registration.getDoctorId(),
                registration.getAppointmentDate(),
                registration.getAssignedSession()
            );
            
            if (!slotAvailable) {
                System.out.println("❌ Không có slot khả dụng, đánh dấu cần xử lý thủ công");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber());
                
                PatientRegistration savedRegistration = repository.save(registration);
                
                // GỬI THÔNG BÁO REAL-TIME - THÊM TRỄ 1 GIÂY
                new Thread(() -> {
                    try {
                        Thread.sleep(1000);
                        webSocketService.notifyNewAppointment(savedRegistration);
                        System.out.println("🔔 Đã gửi thông báo cho đơn đăng ký: " + savedRegistration.getId());
                    } catch (Exception e) {
                        System.err.println("❌ Lỗi khi gửi thông báo: " + e.getMessage());
                    }
                }).start();
                
                return savedRegistration;
            }
        }
        
        // QUAN TRỌNG: Gọi autoApprovalService
        PatientRegistration processedRegistration = autoApprovalService.processNewRegistration(registration);
        
        System.out.println("🎉 Quá trình đăng ký hoàn tất!");
        System.out.println("📋 Trạng thái cuối cùng: " + processedRegistration.getStatus());
        
        // GỬI THÔNG BÁO REAL-TIME - THÊM TRỄ 1 GIÂY
        new Thread(() -> {
            try {
                Thread.sleep(1000);
                webSocketService.notifyNewAppointment(processedRegistration);
                System.out.println("🔔 Đã gửi thông báo cho đơn đăng ký: " + processedRegistration.getId());
            } catch (Exception e) {
                System.err.println("❌ Lỗi khi gửi thông báo: " + e.getMessage());
            }
        }).start();
        
        return processedRegistration;
    }

    public List<PatientRegistration> getRegistrationsNeedingManualReview() {
        return repository.findByStatusOrderByCreatedAtAsc("NEEDS_MANUAL_REVIEW");
    }

    @Transactional
    public PatientRegistration tryApproveRegistration(Long registrationId) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        // QUAN TRỌNG: Sử dụng method checkAvailableSlots mới thay vì doctorSlotService
        boolean hasSlot = checkAvailableSlots(
            registration.getDoctorId(),
            registration.getAppointmentDate(),
            registration.getAssignedSession()
        );

        if (hasSlot) {
            System.out.println("🎯 Duyệt thủ công - Để AutoApprovalService xử lý số thứ tự");
            PatientRegistration approvedRegistration = autoApprovalService.autoApproveRegistration(registration, registration.getAssignedSession());
            
            // GỬI EMAIL KHI DUYỆT ĐƠN THÀNH CÔNG
            if ("APPROVED".equals(approvedRegistration.getStatus())) {
                try {
                    emailService.sendApprovalEmail(approvedRegistration);
                    System.out.println("✅ Đã gửi email duyệt đơn cho: " + approvedRegistration.getEmail());
                } catch (Exception e) {
                    System.err.println("❌ Lỗi gửi email duyệt đơn: " + e.getMessage());
                }
            }
            
            return approvedRegistration;
        } else {
            throw new RuntimeException("Không có slot khả dụng cho buổi khám này");
        }
    }

    @Transactional
    public PatientRegistration rejectRegistration(Long registrationId, String reason) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        registration.setStatus("REJECTED");
        
        return repository.save(registration);
    }

    // SỬA LỖI: Thay đổi tham số amount từ Double thành BigDecimal
    @Transactional
    public PatientRegistration processPaymentSuccess(Long registrationId, String transactionNumber, BigDecimal amount) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        // Cập nhật thông tin thanh toán
        registration.setPaymentStatus("PAID");
        registration.setTransactionNumber(transactionNumber);
        registration.setPaidAmount(amount != null ? amount : BigDecimal.ZERO);
        registration.setPaidAt(LocalDateTime.now());

        PatientRegistration savedRegistration = repository.save(registration);

        // GỬI EMAIL THANH TOÁN THÀNH CÔNG
        try {
            emailService.sendPaymentSuccessEmail(savedRegistration);
            System.out.println("✅ Đã gửi email thanh toán thành công cho: " + savedRegistration.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi email thanh toán: " + e.getMessage());
        }

        return savedRegistration;
    }

    // THÊM PHƯƠNG THỨC OVERLOAD ĐỂ HỖ TRỢ DOUBLE (TÙY CHỌN)
    @Transactional
    public PatientRegistration processPaymentSuccess(Long registrationId, String transactionNumber, Double amount) {
        BigDecimal bigDecimalAmount = amount != null ? BigDecimal.valueOf(amount) : BigDecimal.ZERO;
        return processPaymentSuccess(registrationId, transactionNumber, bigDecimalAmount);
    }

    // MỚI: Method để kiểm tra slot khả dụng
    public boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String assignedSession) {
        try {
            System.out.println("🔍 PatientRegistrationService - Đang kiểm tra slot khả dụng:");
            System.out.println("   - ID Bác sĩ: " + doctorId);
            System.out.println("   - Ngày: " + appointmentDate);
            System.out.println("   - Buổi: " + assignedSession);
            
            if (doctorId == null || appointmentDate == null || assignedSession == null) {
                System.out.println("❌ Thiếu tham số bắt buộc để kiểm tra slot");
                return false;
            }
            
            Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, "APPROVED"
            );
            
            if (approvedCount == null) {
                approvedCount = 0;
            }
            
            System.out.println("📊 Kiểm tra slot - " + assignedSession + ": " + approvedCount + "/" + MAX_PATIENTS_PER_SLOT + " đơn đã được duyệt");
            
            boolean available = approvedCount < MAX_PATIENTS_PER_SLOT;
            System.out.println("✅ Slot khả dụng: " + available);
            
            return available;
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi kiểm tra slot khả dụng: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // MỚI: Method để đếm số lượng đơn approved theo bác sĩ, ngày và khung giờ
    public Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        Long doctorId, LocalDate appointmentDate, String assignedSession, String status) {
        
        System.out.println("🔍 PatientRegistrationService - Đang đếm đơn đăng ký:");
        System.out.println("   - ID Bác sĩ: " + doctorId);
        System.out.println("   - Ngày: " + appointmentDate);
        System.out.println("   - Buổi: " + assignedSession);
        System.out.println("   - Trạng thái: " + status);
        
        try {
            Integer count = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, status
            );
            
            System.out.println("✅ Kết quả đếm: " + count);
            return count != null ? count : 0;
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi đếm đơn đăng ký: " + e.getMessage());
            e.printStackTrace();
            return 0;
        }
    }

    // Các method khác giữ nguyên
    public PatientRegistration save(PatientRegistration registration) {
        return repository.save(registration);
    }

    public PatientRegistration update(PatientRegistration registration) {
        return repository.save(registration);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public List<PatientRegistration> getByPhone(String phone) {
        return repository.findByPhone(phone);
    }

    public List<PatientRegistration> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    private String generateRegistrationNumber() {
        return "REG-" + System.currentTimeMillis();
    }
    
    // ========== THÊM METHOD MỚI CHO THỐNG KÊ ==========
    
    /**
     * Lấy thống kê tổng quan từ patient_registrations
     * KHÔNG ẢNH HƯỞNG ĐẾN LOGIC CŨ
     */
    public Map<String, Object> getRegistrationStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // Lấy tất cả đăng ký
            List<PatientRegistration> allRegistrations = repository.findAll();
            
            // Tổng số lịch hẹn
            int totalAppointments = allRegistrations.size();
            
            // Đếm theo trạng thái thanh toán
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
            
            // Tính tỷ lệ
            double paidRate = totalAppointments > 0 ? (paidCount * 100.0 / totalAppointments) : 0;
            double unpaidRate = totalAppointments > 0 ? (unpaidCount * 100.0 / totalAppointments) : 0;
            double pendingRate = totalAppointments > 0 ? (pendingCount * 100.0 / totalAppointments) : 0;
            
            // Thống kê theo ngày (7 ngày gần nhất)
            Map<String, Object> dailyStats = getDailyRegistrationStats(7);
            
            // Thống kê theo trạng thái khám
            Map<String, Long> examStatusStats = new HashMap<>();
            allRegistrations.stream()
                .filter(r -> r.getExaminationStatus() != null)
                .forEach(r -> {
                    examStatusStats.put(r.getExaminationStatus(), 
                        examStatusStats.getOrDefault(r.getExaminationStatus(), 0L) + 1);
                });
            
            // Thống kê theo khoa
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
            
        } catch (Exception e) {
            System.err.println("❌ Error calculating registration statistics: " + e.getMessage());
            statistics.put("success", false);
            statistics.put("error", "Không thể tính thống kê đăng ký");
        }
        
        return statistics;
    }
    
    /**
     * Thống kê theo ngày
     */
    private Map<String, Object> getDailyRegistrationStats(int days) {
        Map<String, Object> dailyStats = new HashMap<>();
        List<Map<String, Object>> dailyData = new ArrayList<>();
        
        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days - 1);
            
            // Lấy tất cả đăng ký
            List<PatientRegistration> allRegistrations = repository.findAll();
            
            for (int i = 0; i < days; i++) {
                LocalDate currentDate = startDate.plusDays(i);
                String dateKey = currentDate.toString();
                
                List<PatientRegistration> dailyRegistrations = new ArrayList<>();
                for (PatientRegistration r : allRegistrations) {
                    if (r.getAppointmentDate() != null) {
                        // ĐÚNG: appointmentDate đã là LocalDate, không cần toLocalDate()
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
            System.err.println("❌ Error getting daily registration stats: " + e.getMessage());
        }
        
        return dailyStats;
    }
    
    /**
     * Lấy danh sách đăng ký theo trạng thái thanh toán
     */
    public List<PatientRegistration> getRegistrationsByPaymentStatus(String paymentStatus) {
        return repository.findByPaymentStatus(paymentStatus);
    }
    
    /**
     * Lấy tổng doanh thu theo khoảng thời gian
     */
    public Map<String, Object> getRevenueStatistics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> revenueStats = new HashMap<>();
        
        try {
            List<PatientRegistration> registrations = repository.findAll();
            
            // Filter theo ngày
            List<PatientRegistration> filteredRegistrations = new ArrayList<>();
            for (PatientRegistration r : registrations) {
                if (r.getAppointmentDate() != null) {
                    // ĐÚNG: appointmentDate đã là LocalDate, không cần toLocalDate()
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
            
        } catch (Exception e) {
            System.err.println("❌ Error calculating revenue statistics: " + e.getMessage());
            revenueStats.put("success", false);
            revenueStats.put("error", "Không thể tính thống kê doanh thu");
        }
        
        return revenueStats;
    }
}