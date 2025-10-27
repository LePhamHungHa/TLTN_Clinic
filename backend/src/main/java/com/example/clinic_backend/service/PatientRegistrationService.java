package com.example.clinic_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class PatientRegistrationService {

    private final PatientRegistrationRepository repository;
    private final AutoApprovalService autoApprovalService;
    
    @Autowired
    private DoctorSlotService doctorSlotService;

    public PatientRegistrationService(PatientRegistrationRepository repository,
                                    AutoApprovalService autoApprovalService) {
        this.repository = repository;
        this.autoApprovalService = autoApprovalService;
    }

    // METHOD CŨ: Lấy toàn bộ lịch hẹn (không fetch doctor) - DÙNG CHO STATS
    public List<PatientRegistration> getAll() {
        return repository.findAll();
    }

    // METHOD MỚI: Lấy toàn bộ lịch hẹn với doctor - DÙNG CHO ADMIN
    public List<PatientRegistration> getAllWithDoctor() {
        System.out.println("🔍 Service - Getting all registrations WITH DOCTOR info");
        List<PatientRegistration> result = repository.findAllWithDoctor();
        System.out.println("✅ Service - Found " + result.size() + " registrations with doctor info");
        return result;
    }

    // Lấy lịch hẹn theo ID
    public Optional<PatientRegistration> getById(Long id) {
        return repository.findById(id);
    }

    // Lấy lịch hẹn theo email
    public List<PatientRegistration> getByEmail(String email) {
        try {
            System.out.println("🔄 Fetching appointments with doctor info for email: " + email);
            List<PatientRegistration> result = repository.findByEmailWithDoctor(email);
            
            if (!result.isEmpty()) {
                System.out.println("✅ Found " + result.size() + " appointments with doctor info");
                result.forEach(appointment -> {
                    if (appointment.getDoctor() != null) {
                        System.out.println("👨‍⚕️ Doctor: " + appointment.getDoctor().getFullName() + 
                                         " - Degree: " + appointment.getDoctor().getDegree());
                    }
                });
                return result;
            }
            
            System.out.println("🔄 No results with join, trying regular query");
            result = repository.findByEmail(email);
            System.out.println("✅ Found " + result.size() + " appointments using regular query");
            return result;
            
        } catch (Exception e) {
            System.out.println("❌ Query with join failed: " + e.getMessage());
            return repository.findByEmail(email);
        }
    }

    // METHOD QUAN TRỌNG: Tạo đăng ký với tự động duyệt và kiểm tra slot
    @Transactional
    public PatientRegistration createRegistration(PatientRegistration registration) {
        System.out.println("🚀 Starting auto-approval process for: " + registration.getFullName());
        System.out.println("📋 Initial status: " + registration.getStatus());
        System.out.println("📋 Initial queue number: " + registration.getQueueNumber());
        
        // Kiểm tra slot trước khi xử lý
        if (registration.getDoctorId() != null && registration.getAssignedSession() != null) {
            boolean slotAvailable = doctorSlotService.isSlotAvailable(
                registration.getDoctorId(),
                registration.getAppointmentDate().toString(),
                registration.getAssignedSession()
            );
            
            if (!slotAvailable) {
                System.out.println("❌ No available slots, marking for manual review");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber());
                return repository.save(registration);
            }
        }
        
        // QUAN TRỌNG: Chỉ gọi autoApprovalService một lần - nó sẽ tự xử lý số thứ tự
        PatientRegistration processedRegistration = autoApprovalService.processNewRegistration(registration);
        
        System.out.println("🎉 Auto-approval completed!");
        System.out.println("📋 Final status: " + processedRegistration.getStatus());
        System.out.println("📋 Final queue number: " + processedRegistration.getQueueNumber());
        
        return processedRegistration;
    }

    // Lấy đơn cần xử lý thủ công
    public List<PatientRegistration> getRegistrationsNeedingManualReview() {
        return repository.findByStatusOrderByCreatedAtAsc("NEEDS_MANUAL_REVIEW");
    }

    // Thử duyệt đơn thủ công - ĐÃ SỬA
    @Transactional
    public PatientRegistration tryApproveRegistration(Long registrationId) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Registration not found with ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        // Kiểm tra slot từ patient_registrations
        boolean hasSlot = doctorSlotService.isSlotAvailable(
            registration.getDoctorId(),
            registration.getAppointmentDate().toString(),
            registration.getAssignedSession()
        );

        if (hasSlot) {
            // QUAN TRỌNG: Không gán số thứ tự ở đây - để autoApprovalService xử lý
            System.out.println("🎯 Manual approval - Letting AutoApprovalService handle queue number");
            
            return autoApprovalService.autoApproveRegistration(registration, registration.getAssignedSession());
        } else {
            throw new RuntimeException("No available slots for this appointment session");
        }
    }

    // Từ chối đơn
    @Transactional
    public PatientRegistration rejectRegistration(Long registrationId, String reason) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Registration not found with ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        registration.setStatus("REJECTED");
        
        return repository.save(registration);
    }

    // Các method cũ giữ nguyên
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