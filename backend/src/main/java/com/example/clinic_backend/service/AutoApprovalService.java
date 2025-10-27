package com.example.clinic_backend.service;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;
import java.util.Random;

@Service
@Transactional
public class AutoApprovalService {
    
    @Autowired
    private PatientRegistrationRepository repository;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    // Config khung giờ mới (7h-17h)
    private static final String[] TIME_SLOTS = {
        "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
        "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    };
    
    // Số bệnh nhân tối đa mỗi khung giờ
    private static final int MAX_PATIENTS_PER_SLOT = 10;
    
    public boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("🔍 Kiểm tra slot cho bác sĩ: " + doctorId + ", ngày: " + appointmentDate + ", khung giờ: " + timeSlot);
            
            // Đếm số đơn đã được duyệt cho bác sĩ, ngày và khung giờ này
            Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, timeSlot, "APPROVED"
            );
            
            if (approvedCount == null) {
                approvedCount = 0;
            }
            
            System.out.println("📊 Kiểm tra slot - " + timeSlot + ": " + approvedCount + "/" + MAX_PATIENTS_PER_SLOT + " đơn được duyệt");
            
            // Trả về true nếu còn slot
            return approvedCount < MAX_PATIENTS_PER_SLOT;
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi kiểm tra slot: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    public PatientRegistration processNewRegistration(PatientRegistration registration) {
        System.out.println("🚀 AutoApprovalService - Xử lý đăng ký mới: " + registration.getFullName());
        
        // Nếu đã có assignedSession (từ frontend), kiểm tra slot
        if (registration.getDoctorId() != null && registration.getAssignedSession() != null) {
            boolean slotAvailable = checkAvailableSlots(
                registration.getDoctorId(),
                registration.getAppointmentDate(),
                registration.getAssignedSession()
            );
            
            if (slotAvailable) {
                System.out.println("✅ Còn slot, tiến hành auto-approve");
                return autoApproveRegistration(registration, registration.getAssignedSession());
            } else {
                System.out.println("❌ Hết slot, chuyển sang manual review");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber(registration));
                return repository.save(registration);
            }
        } else {
            // Nếu không có assignedSession, tìm slot tự động
            String availableSlot = findAvailableSlot(registration.getDoctorId(), registration.getAppointmentDate());
            
            if (availableSlot != null) {
                System.out.println("✅ Tìm thấy slot: " + availableSlot);
                registration.setAssignedSession(availableSlot);
                return autoApproveRegistration(registration, availableSlot);
            } else {
                System.out.println("❌ Không tìm thấy slot nào");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber(registration));
                return repository.save(registration);
            }
        }
    }
    
    private String findAvailableSlot(Long doctorId, LocalDate appointmentDate) {
        for (String timeSlot : TIME_SLOTS) {
            boolean available = checkAvailableSlots(doctorId, appointmentDate, timeSlot);
            if (available) {
                System.out.println("🎯 Tìm thấy slot khả dụng: " + timeSlot);
                return timeSlot;
            }
        }
        return null;
    }
    
    // QUAN TRỌNG: SỬA LẠI METHOD NÀY - GÁN SỐ THỨ TỰ ĐÚNG CÁCH
    public PatientRegistration autoApproveRegistration(PatientRegistration registration, String timeSlot) {
        System.out.println("🚀 Bắt đầu tự động duyệt đơn - Khung giờ: " + timeSlot);
        
        try {
            // QUAN TRỌNG: Gán số thứ tự TRƯỚC KHI set status APPROVED
            assignQueueAndTimeSlot(registration, timeSlot);
            
            // Generate các thông tin khác
            registration.setRegistrationNumber(generateRegistrationNumber(registration));
            registration.setTransactionNumber(generateTransactionNumber());
            registration.setPatientCode(generatePatientCode(registration));
            
            // Lấy thông tin phòng từ bác sĩ
            if (registration.getDoctorId() != null) {
                doctorRepository.findById(registration.getDoctorId()).ifPresent(doctor -> {
                    registration.setRoomNumber(doctor.getRoomNumber());
                    System.out.println("🏥 Set room number from doctor: " + doctor.getRoomNumber());
                });
            }
            
            registration.setExaminationFee(calculateFee(registration));
            registration.setInsuranceType("Không BHYT");
            
            // QUAN TRỌNG: Set status APPROVED SAU CÙNG
            registration.setStatus("APPROVED");
            registration.setAutoApproved(true);
            registration.setApprovedAt(LocalDateTime.now());
            registration.setAssignedSession(timeSlot);
            
            PatientRegistration saved = repository.save(registration);
            
            System.out.println("🎉 Đã tự động duyệt thành công!");
            System.out.println("📋 Thông tin cuối cùng:");
            System.out.println("   - Mã phiếu: " + saved.getRegistrationNumber());
            System.out.println("   - Số thứ tự: " + saved.getQueueNumber());
            System.out.println("   - Khung giờ: " + saved.getAssignedSession());
            System.out.println("   - Trạng thái: " + saved.getStatus());
            
            return saved;
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi tự động duyệt: " + e.getMessage());
            e.printStackTrace();
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            return repository.save(registration);
        }
    }
    
    // QUAN TRỌNG: SỬA LẠI METHOD NÀY - ĐẾM TRƯỚC KHI CÓ ĐƠN HIỆN TẠI
    private void assignQueueAndTimeSlot(PatientRegistration registration, String timeSlot) {
        LocalDate appointmentDate = registration.getAppointmentDate();
        Long doctorId = registration.getDoctorId();
        
        System.out.println("🔍 Đang đếm số đơn approved TRƯỚC KHI đơn hiện tại được duyệt:");
        System.out.println("   - Bác sĩ: " + doctorId);
        System.out.println("   - Ngày: " + appointmentDate);
        System.out.println("   - Khung giờ: " + timeSlot);
        
        // QUAN TRỌNG: Đếm số đã approved TRƯỚC KHI đơn hiện tại được approve
        // Đơn hiện tại vẫn đang có status = null hoặc PROCESSING
        Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
            doctorId, appointmentDate, timeSlot, "APPROVED"
        );
        
        if (approvedCount == null) {
            approvedCount = 0;
        }
        
        // Số thứ tự = số đã approved + 1
        int queueNumber = approvedCount + 1;
        registration.setQueueNumber(queueNumber);
        registration.setExpectedTimeSlot(timeSlot);
        
        System.out.println("🎯 Đã có " + approvedCount + " đơn approved trước đó");
        System.out.println("🎯 Số thứ tự của đơn hiện tại: " + queueNumber);
        
        // DEBUG: Kiểm tra xem có đơn nào đã approved không
        if (approvedCount > 0) {
            System.out.println("⚠️ CÓ " + approvedCount + " ĐƠN ĐÃ APPROVED TRƯỚC ĐÓ!");
        } else {
            System.out.println("✅ Đây là đơn đầu tiên - số thứ tự sẽ là 1");
        }
    }
    
    private String generateRegistrationNumber(PatientRegistration reg) {
        try {
            String datePart = new SimpleDateFormat("ddMMyy").format(new Date());
            Long dailyCount = repository.countByCreatedAtToday();
            if (dailyCount == null) dailyCount = 0L;
            return "U" + datePart + String.format("%04d", dailyCount + 1);
        } catch (Exception e) {
            System.err.println("❌ Lỗi generate mã phiếu: " + e.getMessage());
            return "U" + System.currentTimeMillis();
        }
    }
    
    private String generateTransactionNumber() {
        try {
            String timePart = new SimpleDateFormat("yyMMddHHmm").format(new Date());
            Random random = new Random();
            String randomPart = String.format("%03d", random.nextInt(1000));
            return timePart + randomPart;
        } catch (Exception e) {
            System.err.println("❌ Lỗi generate mã giao dịch: " + e.getMessage());
            return "TXN" + System.currentTimeMillis();
        }
    }
    
    private String generatePatientCode(PatientRegistration reg) {
        try {
            String yearPart = new SimpleDateFormat("yy").format(new Date());
            Long yearlyCount = repository.countByYear(2024);
            if (yearlyCount == null) yearlyCount = 0L;
            return "N" + yearPart + "-" + String.format("%06d", yearlyCount + 1);
        } catch (Exception e) {
            System.err.println("❌ Lỗi generate mã bệnh nhân: " + e.getMessage());
            return "N" + System.currentTimeMillis();
        }
    }
    
    private BigDecimal calculateFee(PatientRegistration reg) {
        return new BigDecimal("250000");
    }
}