package com.example.clinic_backend.service;

import com.example.clinic_backend.dto.CancelAppointmentDTO;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    // Số bệnh nhân tối đa cho mỗi slot
    private static final int MAX_PATIENTS_PER_SLOT = 10;

    public PatientRegistrationService(PatientRegistrationRepository repository,
                                    AutoApprovalService autoApprovalService,
                                    EmailService emailService) {
        this.repository = repository;
        this.autoApprovalService = autoApprovalService;
        this.emailService = emailService;
    }

    // Lấy tất cả lịch hẹn
    public List<PatientRegistration> getAll() {
        return repository.findAll();
    }

    // Lấy tất cả lịch hẹn với thông tin bác sĩ
    public List<PatientRegistration> getAllWithDoctor() {
        System.out.println("Service - Lấy tất cả đơn đăng ký với thông tin bác sĩ");
        List<PatientRegistration> result = repository.findAllWithDoctor();
        System.out.println("Service - Đã tìm thấy " + result.size() + " đơn đăng ký");
        return result;
    }

    // Lấy lịch hẹn theo ID
    public Optional<PatientRegistration> getById(Long id) {
        return repository.findById(id);
    }

    // Lấy lịch hẹn theo email
    public List<PatientRegistration> getByEmail(String email) {
        try {
            System.out.println("Đang tìm lịch hẹn cho email: " + email);
            
            if (email == null || email.trim().isEmpty()) {
                System.out.println("Email không hợp lệ");
                return new ArrayList<>();
            }
            
            email = email.trim().toLowerCase();
            
            // Thử dùng method có JOIN FETCH
            List<PatientRegistration> result = repository.findByEmailWithDoctor(email);
            
            if (result != null && !result.isEmpty()) {
                System.out.println("Đã tìm thấy " + result.size() + " lịch hẹn");
                
                // Đảm bảo thông tin paymentStatus luôn có
                result.forEach(appointment -> {
                    if (appointment.getPaymentStatus() == null) {
                        if (appointment.getPaidAmount() != null && appointment.getPaidAt() != null) {
                            appointment.setPaymentStatus("PAID");
                        } else {
                            appointment.setPaymentStatus("UNPAID");
                        }
                    }
                    
                    // Đảm bảo examinationFee không null
                    if (appointment.getExaminationFee() == null) {
                        appointment.setExaminationFee(BigDecimal.valueOf(200000));
                    }
                });
                
                return result;
            }
            
            // Fallback
            System.out.println("Không có kết quả với join, thử truy vấn thông thường");
            List<PatientRegistration> fallbackResult = repository.findByEmail(email);
            
            if (fallbackResult != null) {
                System.out.println("Đã tìm thấy " + fallbackResult.size() + " lịch hẹn");
                
                // Đảm bảo thông tin cơ bản
                fallbackResult.forEach(appointment -> {
                    if (appointment.getPaymentStatus() == null) {
                        appointment.setPaymentStatus("UNPAID");
                    }
                    
                    if (appointment.getExaminationFee() == null) {
                        appointment.setExaminationFee(BigDecimal.valueOf(200000));
                    }
                });
                
                return fallbackResult;
            }
            
            return new ArrayList<>();
            
        } catch (Exception e) {
            System.err.println("Lỗi truy vấn với join: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Tạo lịch hẹn mới
    @Transactional
    public PatientRegistration createRegistration(PatientRegistration registration) {
        System.out.println("Bắt đầu quy trình đăng ký cho: " + registration.getFullName());
        
        try {
            // Xử lý tạo registration number nếu chưa có
            if (registration.getRegistrationNumber() == null) {
                registration.setRegistrationNumber(generateRegistrationNumber());
            }
            
            // Đảm bảo created_at không null
            if (registration.getCreatedAt() == null) {
                registration.setCreatedAt(LocalDateTime.now());
            }
            
            // Kiểm tra và đặt trạng thái mặc định
            if (registration.getStatus() == null) {
                registration.setStatus("PENDING");
            }
            
            // Kiểm tra examination_fee
            if (registration.getExaminationFee() == null) {
                registration.setExaminationFee(BigDecimal.valueOf(200000));
            }
            
            // Nếu không có doctorId, không cần kiểm tra slot
            if (registration.getDoctorId() == null) {
                System.out.println("Không chọn bác sĩ - đánh dấu cần xử lý thủ công");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                
                PatientRegistration savedRegistration = repository.save(registration);
                
                // Gửi thông báo real-time
                new Thread(() -> {
                    try {
                        Thread.sleep(1000);
                        webSocketService.notifyNewAppointment(savedRegistration);
                        System.out.println("Đã gửi thông báo cho đơn đăng ký: " + savedRegistration.getId());
                    } catch (Exception e) {
                        System.err.println("Lỗi khi gửi thông báo: " + e.getMessage());
                    }
                }).start();
                
                return savedRegistration;
            }
            
            // Chỉ kiểm tra slot nếu có doctorId và assignedSession
            if (registration.getAssignedSession() != null) {
                boolean slotAvailable = checkAvailableSlots(
                    registration.getDoctorId(),
                    registration.getAppointmentDate(),
                    registration.getAssignedSession()
                );
                
                if (!slotAvailable) {
                    System.out.println("Không có slot khả dụng, đánh dấu cần xử lý thủ công");
                    registration.setStatus("NEEDS_MANUAL_REVIEW");
                    
                    PatientRegistration savedRegistration = repository.save(registration);
                    
                    // Gửi thông báo real-time
                    new Thread(() -> {
                        try {
                            Thread.sleep(1000);
                            webSocketService.notifyNewAppointment(savedRegistration);
                            System.out.println("Đã gửi thông báo cho đơn đăng ký: " + savedRegistration.getId());
                        } catch (Exception e) {
                            System.err.println("Lỗi khi gửi thông báo: " + e.getMessage());
                        }
                    }).start();
                    
                    return savedRegistration;
                }
            }
            
            // Gọi autoApprovalService
            PatientRegistration processedRegistration = autoApprovalService.processNewRegistration(registration);
            
            System.out.println("Quá trình đăng ký hoàn tất!");
            System.out.println("Trạng thái cuối cùng: " + processedRegistration.getStatus());
            
            // Gửi thông báo real-time
            new Thread(() -> {
                try {
                    Thread.sleep(1000);
                    webSocketService.notifyNewAppointment(processedRegistration);
                    System.out.println("Đã gửi thông báo cho đơn đăng ký: " + processedRegistration.getId());
                } catch (Exception e) {
                    System.err.println("Lỗi khi gửi thông báo: " + e.getMessage());
                }
            }).start();
            
            return processedRegistration;
            
        } catch (Exception e) {
            System.err.println("Lỗi tạo đăng ký: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Lấy lịch hẹn cần xử lý thủ công
    public List<PatientRegistration> getRegistrationsNeedingManualReview() {
        return repository.findByStatusOrderByCreatedAtAsc("NEEDS_MANUAL_REVIEW");
    }

    // Duyệt lịch hẹn thủ công
    @Transactional
    public PatientRegistration tryApproveRegistration(Long registrationId) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn đăng ký với ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        // Kiểm tra slot khả dụng
        boolean hasSlot = checkAvailableSlots(
            registration.getDoctorId(),
            registration.getAppointmentDate(),
            registration.getAssignedSession()
        );

        if (hasSlot) {
            System.out.println("Duyệt thủ công - Để AutoApprovalService xử lý số thứ tự");
            PatientRegistration approvedRegistration = autoApprovalService.autoApproveRegistration(registration, registration.getAssignedSession());
            
            // Gửi email khi duyệt đơn thành công
            if ("APPROVED".equals(approvedRegistration.getStatus())) {
                try {
                    emailService.sendApprovalEmail(approvedRegistration);
                    System.out.println("Đã gửi email duyệt đơn cho: " + approvedRegistration.getEmail());
                } catch (Exception e) {
                    System.err.println("Lỗi gửi email duyệt đơn: " + e.getMessage());
                }
            }
            
            return approvedRegistration;
        } else {
            throw new RuntimeException("Không có slot khả dụng cho buổi khám này");
        }
    }

    // Từ chối lịch hẹn
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

    // Xử lý thanh toán thành công
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

        // Gửi email thanh toán thành công
        try {
            emailService.sendPaymentSuccessEmail(savedRegistration);
            System.out.println("Đã gửi email thanh toán thành công cho: " + savedRegistration.getEmail());
        } catch (Exception e) {
            System.err.println("Lỗi gửi email thanh toán: " + e.getMessage());
        }

        return savedRegistration;
    }

    // Xử lý thanh toán thành công với Double
    @Transactional
    public PatientRegistration processPaymentSuccess(Long registrationId, String transactionNumber, Double amount) {
        BigDecimal bigDecimalAmount = amount != null ? BigDecimal.valueOf(amount) : BigDecimal.ZERO;
        return processPaymentSuccess(registrationId, transactionNumber, bigDecimalAmount);
    }

    // Kiểm tra slot khả dụng
    public boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String assignedSession) {
        try {
            System.out.println("PatientRegistrationService - Đang kiểm tra slot khả dụng");
            
            if (doctorId == null || appointmentDate == null || assignedSession == null) {
                System.out.println("Thiếu tham số bắt buộc để kiểm tra slot");
                return false;
            }
            
            Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, "APPROVED"
            );
            
            if (approvedCount == null) {
                approvedCount = 0;
            }
            
            System.out.println("Kiểm tra slot - " + assignedSession + ": " + approvedCount + "/" + MAX_PATIENTS_PER_SLOT + " đơn đã được duyệt");
            
            boolean available = approvedCount < MAX_PATIENTS_PER_SLOT;
            System.out.println("Slot khả dụng: " + available);
            
            return available;
            
        } catch (Exception e) {
            System.err.println("Lỗi khi kiểm tra slot khả dụng: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // Đếm số lượng đơn approved
    public Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        Long doctorId, LocalDate appointmentDate, String assignedSession, String status) {
        
        System.out.println("PatientRegistrationService - Đang đếm đơn đăng ký");
        
        try {
            Integer count = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, status
            );
            
            System.out.println("Kết quả đếm: " + count);
            return count != null ? count : 0;
            
        } catch (Exception e) {
            System.err.println("Lỗi khi đếm đơn đăng ký: " + e.getMessage());
            e.printStackTrace();
            return 0;
        }
    }

    // Các method CRUD cơ bản
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

    // Tạo mã đăng ký
    private String generateRegistrationNumber() {
        return "REG-" + System.currentTimeMillis();
    }
    
    // Hủy lịch hẹn - FIXED VERSION
    @Transactional
    public Map<String, Object> cancelAppointment(CancelAppointmentDTO cancelDTO, Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            System.out.println("=== BẮT ĐẦU XỬ LÝ HỦY LỊCH ===");
            System.out.println("Appointment ID: " + cancelDTO.getAppointmentId());
            System.out.println("User ID từ service: " + userId);
            System.out.println("Reason: " + cancelDTO.getReason());
            
            // Validation cơ bản
            if (cancelDTO.getAppointmentId() == null) {
                result.put("success", false);
                result.put("message", "Thiếu ID lịch hẹn");
                return result;
            }
            
            if (cancelDTO.getReason() == null || cancelDTO.getReason().trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "Vui lòng nhập lý do hủy");
                return result;
            }
            
            Optional<PatientRegistration> registrationOpt = repository.findById(cancelDTO.getAppointmentId());
            
            if (registrationOpt.isEmpty()) {
                result.put("success", false);
                result.put("message", "Không tìm thấy lịch hẹn");
                return result;
            }
            
            PatientRegistration registration = registrationOpt.get();
            
            // LOG thông tin lịch hẹn
            System.out.println("=== THÔNG TIN LỊCH HẸN ===");
            System.out.println("ID: " + registration.getId());
            System.out.println("Email: " + registration.getEmail());
            System.out.println("User ID trong DB: " + registration.getUserId());
            System.out.println("Status: " + registration.getStatus());
            System.out.println("Appointment Date: " + registration.getAppointmentDate());
            System.out.println("Payment Status: " + registration.getPaymentStatus());
            System.out.println("=========================");
            
            // DEV MODE: Tạm thời bỏ qua kiểm tra permission
            boolean hasPermission = true;
            
            if (!hasPermission) {
                result.put("success", false);
                result.put("message", "Bạn không có quyền hủy lịch hẹn này");
                return result;
            }
            
            // Kiểm tra có thể hủy không
            if (!canCancelAppointment(registration)) {
                result.put("success", false);
                result.put("message", getCancellationErrorMessage(registration));
                return result;
            }
            
            // **CẬP NHẬT user_id nếu đang null**
            if (registration.getUserId() == null) {
                registration.setUserId(userId);
                System.out.println("Đã cập nhật user_id: " + userId + " cho lịch hẹn");
            }
            
            // Xử lý hủy lịch
            return processCancellation(registration, cancelDTO, userId);
            
        } catch (Exception e) {
            System.err.println("Lỗi hệ thống khi hủy lịch: " + e.getMessage());
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "Lỗi hệ thống: " + e.getMessage());
            return result;
        }
    }
    
    private boolean checkCancellationPermission(PatientRegistration registration, Long userId, CancelAppointmentDTO cancelDTO) {
        try {
            // Phương án 1: Kiểm tra qua userId nếu cả hai không null
            Long dbUserId = registration.getUserId();
            if (dbUserId != null && userId != null) {
                boolean userIdMatches = dbUserId.equals(userId);
                System.out.println("Kiểm tra quyền qua userId: " + dbUserId + " == " + userId + " = " + userIdMatches);
                if (userIdMatches) {
                    return true;
                }
            }
            
            // Phương án 2: Kiểm tra qua email (fallback)
            String dbEmail = registration.getEmail();
            String requestEmail = cancelDTO.getUserEmail();
            
            if (dbEmail != null && requestEmail != null) {
                boolean emailMatches = dbEmail.equalsIgnoreCase(requestEmail);
                System.out.println("Kiểm tra quyền qua email: " + dbEmail + " == " + requestEmail + " = " + emailMatches);
                if (emailMatches) {
                    return true;
                }
            }
            
            // Phương án 3: Tạm thời cho phép nếu không thể xác thực (CHO DEV/TEST)
            System.out.println("WARNING: Không thể xác thực quyền qua userId hoặc email");
            System.out.println("Tạm thời cho phép hủy lịch");
            return true; // Chỉ cho dev/test
            
        } catch (Exception e) {
            System.err.println("Lỗi kiểm tra quyền: " + e.getMessage());
            return false;
        }
    }
    
    // Kiểm tra điều kiện hủy
    private boolean canCancelAppointment(PatientRegistration registration) {
        if ("CANCELLED".equals(registration.getStatus())) {
            System.out.println("Không thể hủy: lịch đã hủy");
            return false;
        }
        
        if ("COMPLETED".equals(registration.getStatus())) {
            System.out.println("Không thể hủy: lịch đã hoàn thành");
            return false;
        }
        
        if ("IN_PROGRESS".equals(registration.getStatus())) {
            System.out.println("Không thể hủy: đang trong quá trình khám");
            return false;
        }
        
        LocalDate appointmentDate = registration.getAppointmentDate();
        if (appointmentDate == null) {
            System.out.println("Không thể hủy: không có ngày hẹn");
            return false;
        }
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        boolean canCancel = appointmentDate.isAfter(tomorrow);
        
        System.out.println("Ngày hẹn: " + appointmentDate);
        System.out.println("Ngày mai: " + tomorrow);
        System.out.println("Có thể hủy: " + canCancel);
        
        return canCancel;
    }
    
    // Lấy thông báo lỗi khi không thể hủy
    private String getCancellationErrorMessage(PatientRegistration registration) {
        if ("CANCELLED".equals(registration.getStatus())) {
            return "Lịch hẹn đã được hủy trước đó";
        }
        
        if ("COMPLETED".equals(registration.getStatus())) {
            return "Không thể hủy lịch hẹn đã hoàn thành";
        }
        
        if ("IN_PROGRESS".equals(registration.getStatus())) {
            return "Không thể hủy lịch hẹn đang trong quá trình khám";
        }
        
        LocalDate appointmentDate = registration.getAppointmentDate();
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        if (appointmentDate != null && !appointmentDate.isAfter(tomorrow)) {
            return "Chỉ có thể hủy lịch hẹn trước 1 ngày. Lịch hẹn của bạn vào ngày: " 
                + appointmentDate.toString();
        }
        
        return "Không thể hủy lịch hẹn này";
    }
    
    // Xử lý hủy lịch
    private Map<String, Object> processCancellation(PatientRegistration registration, 
                                                    CancelAppointmentDTO cancelDTO, 
                                                    Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Cập nhật thông tin hủy
            registration.setStatus("CANCELLED");
            registration.setCancelledAt(LocalDateTime.now());
            registration.setCancelledBy(userId);
            registration.setCancellationReason(cancelDTO.getReason());
            
            // Xử lý hoàn tiền nếu đã thanh toán và có yêu cầu
            boolean isPaid = "Đã thanh toán".equals(registration.getPaymentStatus()) || 
                           "PAID".equals(registration.getPaymentStatus());
            
            System.out.println("Is paid: " + isPaid);
            System.out.println("Request refund: " + cancelDTO.isRequestRefund());
            
            if (isPaid && cancelDTO.isRequestRefund()) {
                registration.setRefundStatus("REQUESTED");
                registration.setRefundRequestedAt(LocalDateTime.now());
                
                // Lưu thông tin tài khoản hoàn tiền
                String refundInfo = buildRefundInfo(cancelDTO);
                registration.setRefundAccountInfo(refundInfo);
                
                // Tính toán số tiền hoàn
                BigDecimal refundAmount = calculateRefundAmount(registration);
                registration.setRefundAmount(refundAmount);
                
                result.put("refundRequested", true);
                result.put("refundAmount", refundAmount);
                
                // Gửi thông báo cho admin về yêu cầu hoàn tiền
                notifyAdminAboutRefundRequest(registration, refundAmount);
            } else {
                registration.setRefundStatus("NONE");
            }
            
            // Lưu thay đổi
            PatientRegistration cancelledRegistration = repository.save(registration);
            
            // Gửi email thông báo hủy lịch
            try {
                emailService.sendCancellationEmail(cancelledRegistration, cancelDTO.getReason());
                result.put("emailSent", true);
                System.out.println("Đã gửi email thông báo hủy lịch");
            } catch (Exception e) {
                System.err.println("Lỗi gửi email hủy lịch: " + e.getMessage());
                result.put("emailSent", false);
            }
            
            // Gửi thông báo real-time
            try {
                webSocketService.notifyAppointmentCancelled(cancelledRegistration);
                System.out.println("Đã gửi thông báo real-time về việc hủy lịch");
            } catch (Exception e) {
                System.err.println("Lỗi gửi thông báo real-time: " + e.getMessage());
            }
            
            result.put("success", true);
            result.put("message", "Hủy lịch hẹn thành công");
            result.put("appointmentId", cancelledRegistration.getId());
            result.put("status", cancelledRegistration.getStatus());
            result.put("cancelledAt", cancelledRegistration.getCancelledAt());
            result.put("refundStatus", cancelledRegistration.getRefundStatus());
            
            System.out.println("Hủy lịch hẹn thành công: " + cancelledRegistration.getId());
            
        } catch (Exception e) {
            System.err.println("Lỗi xử lý hủy lịch: " + e.getMessage());
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "Lỗi xử lý: " + e.getMessage());
        }
        
        return result;
    }
    
    // Kiểm tra điều kiện hủy lịch
    public Map<String, Object> checkCancellationEligibility(Long appointmentId, Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            System.out.println("Kiểm tra điều kiện hủy lịch");
            
            Optional<PatientRegistration> registrationOpt = repository.findById(appointmentId);
            
            if (registrationOpt.isEmpty()) {
                result.put("eligible", false);
                result.put("message", "Không tìm thấy lịch hẹn");
                return result;
            }
            
            PatientRegistration registration = registrationOpt.get();
            
            // DEV MODE: Tạm thời bỏ qua permission check
            boolean hasPermission = true;
            
            if (!hasPermission) {
                result.put("eligible", false);
                result.put("message", "Bạn không có quyền truy cập lịch hẹn này");
                return result;
            }
            
            // Kiểm tra điều kiện hủy
            boolean canCancel = canCancelAppointment(registration);
            
            result.put("eligible", canCancel);
            result.put("appointmentDate", registration.getAppointmentDate());
            result.put("currentStatus", registration.getStatus());
            result.put("paymentStatus", registration.getPaymentStatus());
            result.put("examinationFee", registration.getExaminationFee());
            
            if (!canCancel) {
                result.put("message", getCancellationErrorMessage(registration));
            } else {
                result.put("message", "Có thể hủy lịch hẹn");
                
                // Tính toán thông tin hoàn tiền nếu có
                boolean isPaid = "Đã thanh toán".equals(registration.getPaymentStatus()) || 
                               "PAID".equals(registration.getPaymentStatus());
                
                if (isPaid) {
                    BigDecimal refundAmount = calculateRefundAmount(registration);
                    result.put("canRequestRefund", true);
                    result.put("estimatedRefund", refundAmount);
                    result.put("examinationFee", registration.getExaminationFee());
                    
                    // Tính số ngày còn lại
                    long daysUntilAppointment = java.time.temporal.ChronoUnit.DAYS.between(
                        LocalDate.now(), registration.getAppointmentDate()
                    );
                    result.put("daysUntilAppointment", daysUntilAppointment);
                    
                    // Xác định tỷ lệ hoàn tiền
                    double refundPercentage = getRefundPercentage(daysUntilAppointment);
                    result.put("refundPercentage", refundPercentage * 100);
                } else {
                    result.put("canRequestRefund", false);
                }
            }
            
            System.out.println("Kết quả kiểm tra điều kiện hủy: " + result);
            
        } catch (Exception e) {
            System.err.println("Lỗi kiểm tra điều kiện hủy: " + e.getMessage());
            result.put("eligible", false);
            result.put("message", "Lỗi kiểm tra điều kiện hủy");
        }
        
        return result;
    }
    
    // Xây dựng thông tin hoàn tiền
    private String buildRefundInfo(CancelAppointmentDTO dto) {
        StringBuilder info = new StringBuilder();
        
        info.append("Thông tin hoàn tiền:\n");
        
        if (dto.getRefundAccountInfo() != null && !dto.getRefundAccountInfo().isEmpty()) {
            info.append("Ghi chú: ").append(dto.getRefundAccountInfo()).append("\n");
        }
        
        if (dto.getBankAccountNumber() != null && !dto.getBankAccountNumber().isEmpty()) {
            info.append("Số tài khoản: ").append(dto.getBankAccountNumber()).append("\n");
        }
        
        if (dto.getBankName() != null && !dto.getBankName().isEmpty()) {
            info.append("Ngân hàng: ").append(dto.getBankName()).append("\n");
        }
        
        if (dto.getAccountHolderName() != null && !dto.getAccountHolderName().isEmpty()) {
            info.append("Chủ tài khoản: ").append(dto.getAccountHolderName()).append("\n");
        }
        
        info.append("Thời gian yêu cầu: ").append(LocalDateTime.now().toString()).append("\n");
        
        return info.toString();
    }
    
    // Tính toán số tiền hoàn
    private BigDecimal calculateRefundAmount(PatientRegistration registration) {
        BigDecimal examinationFee = registration.getExaminationFee() != null ? 
            registration.getExaminationFee() : BigDecimal.valueOf(200000);
        
        LocalDate appointmentDate = registration.getAppointmentDate();
        long daysUntilAppointment = java.time.temporal.ChronoUnit.DAYS.between(
            LocalDate.now(), appointmentDate
        );
        
        double refundPercentage = getRefundPercentage(daysUntilAppointment);
        
        return examinationFee.multiply(BigDecimal.valueOf(refundPercentage));
    }
    
    // Xác định tỷ lệ hoàn tiền
    private double getRefundPercentage(long daysUntilAppointment) {
        if (daysUntilAppointment >= 3) {
            return 0.8; // 80%
        } else if (daysUntilAppointment >= 1) {
            return 0.5; // 50%
        } else {
            return 0; // Không hoàn tiền
        }
    }
    
    // Thông báo cho admin về yêu cầu hoàn tiền
    private void notifyAdminAboutRefundRequest(PatientRegistration registration, BigDecimal refundAmount) {
        try {
            // Gửi thông báo qua WebSocket
            Map<String, Object> refundNotification = new HashMap<>();
            refundNotification.put("type", "REFUND_REQUEST");
            refundNotification.put("appointmentId", registration.getId());
            refundNotification.put("patientName", registration.getFullName());
            refundNotification.put("refundAmount", refundAmount);
            refundNotification.put("requestedAt", LocalDateTime.now());
            refundNotification.put("registrationNumber", registration.getRegistrationNumber());
            
            webSocketService.sendNotificationToAdmins(refundNotification);
            
            System.out.println("Đã gửi thông báo yêu cầu hoàn tiền cho admin");
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo hoàn tiền: " + e.getMessage());
        }
    }
    
    // Lấy danh sách lịch hẹn có thể hủy
    public List<PatientRegistration> getCancellableAppointments(Long userId) {
        try {
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            return repository.findCancellableAppointments(userId, tomorrow);
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách lịch có thể hủy: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    // Lấy danh sách yêu cầu hoàn tiền
    public List<PatientRegistration> getRefundRequests() {
        try {
            return repository.findRefundRequests();
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách yêu cầu hoàn tiền: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    // Xử lý hoàn tiền (cho admin)
    @Transactional
    public Map<String, Object> processRefund(Long appointmentId, boolean approve, String adminNote) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<PatientRegistration> registrationOpt = repository.findById(appointmentId);
            
            if (registrationOpt.isEmpty()) {
                result.put("success", false);
                result.put("message", "Không tìm thấy lịch hẹn");
                return result;
            }
            
            PatientRegistration registration = registrationOpt.get();
            
            if (!"REQUESTED".equals(registration.getRefundStatus())) {
                result.put("success", false);
                result.put("message", "Lịch hẹn này không có yêu cầu hoàn tiền");
                return result;
            }
            
            if (approve) {
                registration.setRefundStatus("PROCESSED");
                registration.setRefundProcessedAt(LocalDateTime.now());
                
                result.put("message", "Đã duyệt yêu cầu hoàn tiền");
                
                // Gửi email thông báo hoàn tiền thành công
                try {
                    emailService.sendRefundProcessedEmail(registration);
                } catch (Exception e) {
                    System.err.println("Lỗi gửi email hoàn tiền: " + e.getMessage());
                }
            } else {
                registration.setRefundStatus("REJECTED");
                registration.setCancellationReason(
                    (registration.getCancellationReason() != null ? registration.getCancellationReason() + "\n" : "") +
                    "Từ chối hoàn tiền bởi admin: " + adminNote
                );
                
                result.put("message", "Đã từ chối yêu cầu hoàn tiền");
                
                // Gửi email thông báo từ chối hoàn tiền
                try {
                    emailService.sendRefundRejectedEmail(registration, adminNote);
                } catch (Exception e) {
                    System.err.println("Lỗi gửi email từ chối hoàn tiền: " + e.getMessage());
                }
            }
            
            repository.save(registration);
            result.put("success", true);
            result.put("refundStatus", registration.getRefundStatus());
            
        } catch (Exception e) {
            System.err.println("Lỗi xử lý hoàn tiền: " + e.getMessage());
            result.put("success", false);
            result.put("message", "Lỗi xử lý hoàn tiền: " + e.getMessage());
        }
        
        return result;
    }
}