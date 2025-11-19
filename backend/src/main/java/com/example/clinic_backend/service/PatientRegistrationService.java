package com.example.clinic_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;

@Service
public class PatientRegistrationService {

    private final PatientRegistrationRepository repository;
    private final AutoApprovalService autoApprovalService;
    
    @Autowired
    private DoctorSlotService doctorSlotService;

    // Thêm constant
    private static final int MAX_PATIENTS_PER_SLOT = 10;

    public PatientRegistrationService(PatientRegistrationRepository repository,
                                    AutoApprovalService autoApprovalService) {
        this.repository = repository;
        this.autoApprovalService = autoApprovalService;
    }

    public List<PatientRegistration> getAll() {
        return repository.findAll();
    }

    public List<PatientRegistration> getAllWithDoctor() {
        System.out.println("🔍 Service - Getting all registrations WITH DOCTOR info");
        List<PatientRegistration> result = repository.findAllWithDoctor();
        System.out.println("✅ Service - Found " + result.size() + " registrations with doctor info");
        return result;
    }

    public Optional<PatientRegistration> getById(Long id) {
        return repository.findById(id);
    }

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

    @Transactional
    public PatientRegistration createRegistration(PatientRegistration registration) {
        System.out.println("🚀 Starting registration process for: " + registration.getFullName());
        System.out.println("📋 Initial details:");
        System.out.println("   - Doctor ID: " + registration.getDoctorId());
        System.out.println("   - Assigned Session: " + registration.getAssignedSession());
        System.out.println("   - Initial status: " + registration.getStatus());
        
        // QUAN TRỌNG: Nếu không có doctorId, không cần kiểm tra slot
        if (registration.getDoctorId() == null) {
            System.out.println("⚠️ No doctor selected - marking for manual review");
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            registration.setRegistrationNumber(generateRegistrationNumber());
            return repository.save(registration);
        }
        
        // Chỉ kiểm tra slot nếu có doctorId VÀ assignedSession
        if (registration.getAssignedSession() != null) {
            boolean slotAvailable = checkAvailableSlots(
                registration.getDoctorId(),
                registration.getAppointmentDate(),
                registration.getAssignedSession()
            );
            
            if (!slotAvailable) {
                System.out.println("❌ No available slots, marking for manual review");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber());
                return repository.save(registration);
            }
        }
        
        // IMPORTANT: Call autoApprovalService
        PatientRegistration processedRegistration = autoApprovalService.processNewRegistration(registration);
        
        System.out.println("🎉 Registration processing completed!");
        System.out.println("📋 Final status: " + processedRegistration.getStatus());
        
        return processedRegistration;
    }

    public List<PatientRegistration> getRegistrationsNeedingManualReview() {
        return repository.findByStatusOrderByCreatedAtAsc("NEEDS_MANUAL_REVIEW");
    }

    @Transactional
    public PatientRegistration tryApproveRegistration(Long registrationId) {
        Optional<PatientRegistration> registrationOpt = repository.findById(registrationId);
        if (registrationOpt.isEmpty()) {
            throw new RuntimeException("Registration not found with ID: " + registrationId);
        }

        PatientRegistration registration = registrationOpt.get();
        
        // QUAN TRỌNG: Sử dụng method checkAvailableSlots mới thay vì doctorSlotService
        boolean hasSlot = checkAvailableSlots(
            registration.getDoctorId(),
            registration.getAppointmentDate(),
            registration.getAssignedSession()
        );

        if (hasSlot) {
            System.out.println("🎯 Manual approval - Letting AutoApprovalService handle queue number");
            return autoApprovalService.autoApproveRegistration(registration, registration.getAssignedSession());
        } else {
            throw new RuntimeException("No available slots for this appointment session");
        }
    }

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

    // MỚI: Method để kiểm tra slot khả dụng
    public boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String assignedSession) {
        try {
            System.out.println("🔍 PatientRegistrationService - Checking available slots:");
            System.out.println("   - Doctor ID: " + doctorId);
            System.out.println("   - Date: " + appointmentDate);
            System.out.println("   - Session: " + assignedSession);
            
            if (doctorId == null || appointmentDate == null || assignedSession == null) {
                System.out.println("❌ Missing required parameters for slot check");
                return false;
            }
            
            Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, "APPROVED"
            );
            
            if (approvedCount == null) {
                approvedCount = 0;
            }
            
            System.out.println("📊 Slot check - " + assignedSession + ": " + approvedCount + "/" + MAX_PATIENTS_PER_SLOT + " đơn được duyệt");
            
            boolean available = approvedCount < MAX_PATIENTS_PER_SLOT;
            System.out.println("✅ Slot available: " + available);
            
            return available;
            
        } catch (Exception e) {
            System.err.println("❌ Error checking available slots: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // MỚI: Method để đếm số lượng đơn approved theo bác sĩ, ngày và khung giờ
    public Integer countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
        Long doctorId, LocalDate appointmentDate, String assignedSession, String status) {
        
        System.out.println("🔍 PatientRegistrationService - Counting registrations:");
        System.out.println("   - Doctor ID: " + doctorId);
        System.out.println("   - Date: " + appointmentDate);
        System.out.println("   - Session: " + assignedSession);
        System.out.println("   - Status: " + status);
        
        try {
            Integer count = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, assignedSession, status
            );
            
            System.out.println("✅ Count result: " + count);
            return count != null ? count : 0;
            
        } catch (Exception e) {
            System.err.println("❌ Error counting registrations: " + e.getMessage());
            e.printStackTrace();
            return 0;
        }
    }

    // Other methods remain the same
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