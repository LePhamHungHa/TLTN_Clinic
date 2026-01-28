package com.example.clinic_backend.service;

import com.example.clinic_backend.model.DoctorSlot;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.DoctorSlotRepository;
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
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class AutoApprovalService {
    
    @Autowired
    private PatientRegistrationRepository repository;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private DoctorSlotService doctorSlotService;
    
    @Autowired
    private DoctorSlotRepository doctorSlotRepository;

    @Autowired
    private EmailService emailService;
    
    // cac khung gio co dinh
    private static final String[] TIME_SLOTS = {
        "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
        "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    };
    
    // kiem tra slot con trong khong
    public boolean checkAvailableSlots(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("Kiem tra slot: bac si " + doctorId + ", ngay " + appointmentDate + ", gio " + timeSlot);
            
            // tim slot trong database
            Optional<DoctorSlot> slotOpt = doctorSlotRepository.findByDoctorIdAndAppointmentDateAndTimeSlot(doctorId, appointmentDate.toString(), timeSlot);
            
            int maxPatients;
            if (slotOpt.isPresent()) {
                DoctorSlot slot = slotOpt.get();
                // kiem tra slot co active khong
                if (slot.getIsActive() != null && !slot.getIsActive()) {
                    System.out.println("Slot da bi vo hieu hoa");
                    return false;
                }
                maxPatients = slot.getMaxPatients() != null ? slot.getMaxPatients() : 10;
                System.out.println("Slot tu DB - So benh nhan toi da: " + maxPatients);
            } else {
                maxPatients = 10; // mac dinh
                System.out.println("Slot mac dinh - So benh nhan toi da: " + maxPatients);
            }
            
            // dem so don da duyet
            Integer approvedCount = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, appointmentDate, timeSlot, "APPROVED"
            );
            
            if (approvedCount == null) {
                approvedCount = 0;
            }
            
            System.out.println("Kiem tra slot - " + timeSlot + ": " + approvedCount + "/" + maxPatients + " don da duyet");
            
            // tra ve true neu con slot
            return approvedCount < maxPatients;
        } catch (Exception e) {
            System.out.println("Loi kiem tra slot: " + e.getMessage());
            return false;
        }
    }
    
    @Transactional
    public PatientRegistration processNewRegistration(PatientRegistration registration) {
        System.out.println("AutoApprovalService - Xu ly dang ky moi: " + registration.getFullName());
        System.out.println("Thong tin dang ky:");
        System.out.println("Bac si ID: " + registration.getDoctorId());
        System.out.println("Khung gio: " + registration.getAssignedSession());
        
        // neu khong co bac si -> chuyen sang manual review
        if (registration.getDoctorId() == null) {
            System.out.println("Khong co bac si, chuyen sang MANUAL REVIEW");
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            registration.setRegistrationNumber(generateRegistrationNumber(registration));
            return repository.save(registration);
        }
        
        // neu da co assignedSession (tu frontend), kiem tra slot
        if (registration.getAssignedSession() != null) {
            boolean slotAvailable = checkAvailableSlots(
                registration.getDoctorId(),
                registration.getAppointmentDate(),
                registration.getAssignedSession()
            );
            
            if (slotAvailable) {
                System.out.println("Con slot, tien hanh auto-approve");
                return autoApproveRegistration(registration, registration.getAssignedSession());
            } else {
                System.out.println("Het slot, chuyen sang manual review");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber(registration));
                return repository.save(registration);
            }
        } else {
            // neu khong co assignedSession, tim slot tu dong
            String availableSlot = findAvailableSlot(registration.getDoctorId(), registration.getAppointmentDate());
            
            if (availableSlot != null) {
                System.out.println("Tim thay slot: " + availableSlot);
                registration.setAssignedSession(availableSlot);
                return autoApproveRegistration(registration, availableSlot);
            } else {
                System.out.println("Khong tim thay slot nao");
                registration.setStatus("NEEDS_MANUAL_REVIEW");
                registration.setRegistrationNumber(generateRegistrationNumber(registration));
                return repository.save(registration);
            }
        }
    }
    
    // tim slot con trong
    private String findAvailableSlot(Long doctorId, LocalDate appointmentDate) {
        // kiem tra tung khung gio
        for (String timeSlot : TIME_SLOTS) {
            boolean available = checkAvailableSlots(doctorId, appointmentDate, timeSlot);
            if (available) {
                System.out.println("Tim thay slot kha dung: " + timeSlot);
                return timeSlot;
            }
        }
        return null;
    }
    
    @Transactional
    public PatientRegistration autoApproveRegistration(PatientRegistration registration, String timeSlot) {
        System.out.println("Bat dau tu dong duyet don - Khung gio: " + timeSlot);
        
        try {
            // su dung lock de lay so thu tu
            assignQueueAndTimeSlotWithLock(registration, timeSlot);
            
            // tao cac thong tin khac
            registration.setRegistrationNumber(generateRegistrationNumber(registration));
            registration.setTransactionNumber(generateTransactionNumber());
            registration.setPatientCode(generatePatientCode(registration));
            
            // lay thong tin phong tu bac si
            if (registration.getDoctorId() != null) {
                doctorRepository.findById(registration.getDoctorId()).ifPresent(doctor -> {
                    registration.setRoomNumber(doctor.getRoomNumber());
                    System.out.println("Set so phong tu bac si: " + doctor.getRoomNumber());
                });
            }
            
            // set cac thong tin khac
            registration.setExaminationFee(calculateFee(registration));
            registration.setInsuranceType("Không BHYT");
            
            // set status APPROVED
            registration.setStatus("APPROVED");
            registration.setAutoApproved(true);
            registration.setApprovedAt(LocalDateTime.now());
            registration.setAssignedSession(timeSlot);
            
            // luu vao database
            PatientRegistration saved = repository.save(registration);

            // gui email khi duyet don
            try {
                emailService.sendApprovalEmail(saved);
                System.out.println("Da gui email duyet don cho: " + saved.getEmail());
            } catch (Exception e) {
                System.out.println("Loi gui email duyet don: " + e.getMessage());
            }
            
            System.out.println("Da tu dong duyet thanh cong!");
            System.out.println("Thong tin cuoi cung:");
            System.out.println("Ma phieu: " + saved.getRegistrationNumber());
            System.out.println("So thu tu: " + saved.getQueueNumber());
            System.out.println("Khung gio: " + saved.getAssignedSession());
            System.out.println("Trang thai: " + saved.getStatus());
            
            return saved;
        } catch (Exception e) {
            System.out.println("Loi khi tu dong duyet: " + e.getMessage());
            registration.setStatus("NEEDS_MANUAL_REVIEW");
            return repository.save(registration);
        }
    }
    
    // su dung lock de tranh trung so thu tu
    private void assignQueueAndTimeSlotWithLock(PatientRegistration registration, String timeSlot) {
        LocalDate appointmentDate = registration.getAppointmentDate();
        Long doctorId = registration.getDoctorId();
        
        System.out.println("Dang lay so thu tu voi LOCK:");
        System.out.println("Bac si: " + doctorId);
        System.out.println("Ngay: " + appointmentDate);
        System.out.println("Khung gio: " + timeSlot);
        
        // su dung method co LOCK
        int queueNumber = doctorSlotService.getNextQueueNumberWithLock(doctorId, appointmentDate, timeSlot);
        
        registration.setQueueNumber(queueNumber);
        registration.setExpectedTimeSlot(timeSlot);
        
        System.out.println("So thu tu cua don hien tai: " + queueNumber);
        
        // kiem tra lai sau khi co lock
        Integer finalCheck = repository.countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
            doctorId, appointmentDate, timeSlot, "APPROVED"
        );
        System.out.println("Final check - So don approved: " + finalCheck);
    }
    
    // tao ma phieu dang ky
    private String generateRegistrationNumber(PatientRegistration reg) {
        try {
            String datePart = new SimpleDateFormat("ddMMyy").format(new Date());
            Long dailyCount = repository.countByCreatedAtToday();
            if (dailyCount == null) dailyCount = 0L;
            return "U" + datePart + String.format("%04d", dailyCount + 1);
        } catch (Exception e) {
            System.out.println("Loi generate ma phieu: " + e.getMessage());
            return "U" + System.currentTimeMillis();
        }
    }
    
    // tao ma giao dich
    private String generateTransactionNumber() {
        try {
            String timePart = new SimpleDateFormat("yyMMddHHmm").format(new Date());
            Random random = new Random();
            String randomPart = String.format("%03d", random.nextInt(1000));
            return timePart + randomPart;
        } catch (Exception e) {
            System.out.println("Loi generate ma giao dich: " + e.getMessage());
            return "TXN" + System.currentTimeMillis();
        }
    }
    
    // tao ma benh nhan
    private String generatePatientCode(PatientRegistration reg) {
        try {
            String yearPart = new SimpleDateFormat("yy").format(new Date());
            Long yearlyCount = repository.countByYear(2024);
            if (yearlyCount == null) yearlyCount = 0L;
            return "N" + yearPart + "-" + String.format("%06d", yearlyCount + 1);
        } catch (Exception e) {
            System.out.println("Loi generate ma benh nhan: " + e.getMessage());
            return "N" + System.currentTimeMillis();
        }
    }
    
    // tinh phi kham
    private BigDecimal calculateFee(PatientRegistration reg) {
        return new BigDecimal("250000");
    }
}