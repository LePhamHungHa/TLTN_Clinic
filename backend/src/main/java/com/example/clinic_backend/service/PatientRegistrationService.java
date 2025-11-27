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
            List<PatientRegistration> result = repository.findByEmailWithDoctor(email);
            
            if (!result.isEmpty()) {
                System.out.println("✅ Đã tìm thấy " + result.size() + " lịch hẹn với thông tin bác sĩ");
                result.forEach(appointment -> {
                    if (appointment.getDoctor() != null) {
                        System.out.println("👨‍⚕️ Bác sĩ: " + appointment.getDoctor().getFullName() + 
                                         " - Bằng cấp: " + appointment.getDoctor().getDegree());
                    }
                });
                return result;
            }
            
            System.out.println("🔄 Không có kết quả với join, thử truy vấn thông thường");
            result = repository.findByEmail(email);
            System.out.println("✅ Đã tìm thấy " + result.size() + " lịch hẹn bằng truy vấn thông thường");
            return result;
            
        } catch (Exception e) {
            System.out.println("❌ Truy vấn với join thất bại: " + e.getMessage());
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
}