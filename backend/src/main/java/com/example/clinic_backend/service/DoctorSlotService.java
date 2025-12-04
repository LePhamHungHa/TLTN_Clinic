package com.example.clinic_backend.service;

import com.example.clinic_backend.dto.DoctorSlotDTO;
import com.example.clinic_backend.model.DoctorSlot;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.DoctorSlotRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.*;

@Service
public class DoctorSlotService {
    
    @Autowired
    private DoctorSlotRepository doctorSlotRepository;
    
    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;
    
    private static final String[] DEFAULT_TIME_SLOTS = {
        "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
        "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    };
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    // ========== ADMIN CRUD OPERATIONS ==========
    
    public List<DoctorSlot> getAllSlots() {
        return doctorSlotRepository.findAll();
    }
    
    public List<DoctorSlot> getSlotsByDoctor(Long doctorId) {
        return doctorSlotRepository.findByDoctorId(doctorId);
    }
    
    public List<DoctorSlot> getUpcomingSlots() {
        String today = LocalDate.now().format(DATE_FORMATTER);
        return doctorSlotRepository.findByAppointmentDateGreaterThanEqual(today);
    }
    
    public DoctorSlot getSlotById(Long id) {
        return doctorSlotRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy slot với ID: " + id));
    }
    
    public DoctorSlot createSlot(DoctorSlot slot) {
        // Validate
        if (slot.getDoctorId() == null) {
            throw new RuntimeException("Doctor ID không được để trống");
        }
        if (slot.getAppointmentDate() == null) {
            throw new RuntimeException("Ngày khám không được để trống");
        }
        if (slot.getTimeSlot() == null) {
            throw new RuntimeException("Khung giờ không được để trống");
        }
        
        // Check if slot already exists
        boolean exists = doctorSlotRepository.existsByDoctorIdAndAppointmentDateAndTimeSlot(
            slot.getDoctorId(), slot.getAppointmentDate(), slot.getTimeSlot());
        
        if (exists) {
            throw new RuntimeException("Slot đã tồn tại cho bác sĩ này vào thời gian này");
        }
        
        // Set default values
        if (slot.getMaxPatients() == null || slot.getMaxPatients() < 1) {
            slot.setMaxPatients(10);
        }
        if (slot.getIsActive() == null) {
            slot.setIsActive(true);
        }
        
        slot.setCreatedAt(LocalDateTime.now());
        slot.setUpdatedAt(LocalDateTime.now());
        
        return doctorSlotRepository.save(slot);
    }
    
    public DoctorSlot updateSlot(Long id, DoctorSlot slotDetails) {
        DoctorSlot slot = getSlotById(id);
        
        // Cập nhật các trường có thể thay đổi
        if (slotDetails.getMaxPatients() != null) {
            slot.setMaxPatients(slotDetails.getMaxPatients());
        }
        if (slotDetails.getIsActive() != null) {
            slot.setIsActive(slotDetails.getIsActive());
        }
        
        slot.setUpdatedAt(LocalDateTime.now());
        
        return doctorSlotRepository.save(slot);
    }
    
    public DoctorSlot updateMaxPatients(Long id, Integer maxPatients) {
        if (maxPatients == null || maxPatients < 1) {
            throw new RuntimeException("Số bệnh nhân tối đa phải lớn hơn 0");
        }
        
        DoctorSlot slot = getSlotById(id);
        
        // Kiểm tra số bệnh nhân hiện tại
        Integer currentPatients = getCurrentPatientsForSlot(slot);
        if (currentPatients > maxPatients) {
            throw new RuntimeException(
                "Không thể đặt số bệnh nhân tối đa nhỏ hơn số bệnh nhân hiện tại (" + currentPatients + ")");
        }
        
        slot.setMaxPatients(maxPatients);
        slot.setUpdatedAt(LocalDateTime.now());
        
        return doctorSlotRepository.save(slot);
    }
    
    public void bulkUpdateMaxPatients(Integer maxPatients) {
        if (maxPatients == null || maxPatients < 1) {
            throw new RuntimeException("Số bệnh nhân tối đa phải lớn hơn 0");
        }
        
        List<DoctorSlot> allSlots = doctorSlotRepository.findAll();
        
        for (DoctorSlot slot : allSlots) {
            // Kiểm tra từng slot
            Integer currentPatients = getCurrentPatientsForSlot(slot);
            if (currentPatients <= maxPatients) {
                slot.setMaxPatients(maxPatients);
                slot.setUpdatedAt(LocalDateTime.now());
            }
            // Nếu currentPatients > maxPatients, bỏ qua slot này
        }
        
        doctorSlotRepository.saveAll(allSlots);
    }
    
    public void deleteSlot(Long id) {
        DoctorSlot slot = getSlotById(id);
        
        // Kiểm tra xem slot đã có bệnh nhân chưa
        Integer currentPatients = getCurrentPatientsForSlot(slot);
        if (currentPatients > 0) {
            throw new RuntimeException("Không thể xóa slot đã có bệnh nhân đăng ký");
        }
        
        doctorSlotRepository.deleteById(id);
    }
    
    // ========== PUBLIC/FEATURE OPERATIONS ==========
    
    public List<DoctorSlotDTO> getSlotsByDoctorAndDate(Long doctorId, String appointmentDate) {
        List<DoctorSlotDTO> result = new ArrayList<>();
        
        // Lấy slot từ database (nếu có)
        List<DoctorSlot> existingSlots = doctorSlotRepository
            .findByDoctorIdAndAppointmentDate(doctorId, appointmentDate);
        
        Map<String, DoctorSlot> slotMap = new HashMap<>();
        for (DoctorSlot slot : existingSlots) {
            if (slot.getIsActive()) {
                slotMap.put(slot.getTimeSlot(), slot);
            }
        }
        
        // Tạo slot cho tất cả các khung giờ
        for (String timeSlot : DEFAULT_TIME_SLOTS) {
            DoctorSlotDTO slotDTO = new DoctorSlotDTO();
            slotDTO.setDoctorId(doctorId);
            slotDTO.setAppointmentDate(appointmentDate);
            slotDTO.setTimeSlot(timeSlot);
            
            // Lấy slot từ database nếu có
            DoctorSlot dbSlot = slotMap.get(timeSlot);
            if (dbSlot != null) {
                // Slot đã được cấu hình trong database
                slotDTO.setMaxPatients(dbSlot.getMaxPatients());
            } else {
                // Slot mặc định
                slotDTO.setMaxPatients(10);
            }
            
            // Tính số bệnh nhân hiện tại
            Integer currentPatients = getCurrentPatients(doctorId, appointmentDate, timeSlot);
            slotDTO.setCurrentPatients(currentPatients != null ? currentPatients : 0);
            slotDTO.setAvailable(currentPatients == null || currentPatients < slotDTO.getMaxPatients());
            
            result.add(slotDTO);
        }
        
        return result;
    }
    
    public boolean isSlotAvailable(Long doctorId, String appointmentDate, String timeSlot) {
        try {
            // Lấy slot từ database
            Optional<DoctorSlot> slotOpt = doctorSlotRepository.findByDoctorIdAndAppointmentDateAndTimeSlot(doctorId, appointmentDate, timeSlot);
            
            int maxPatients;
            if (slotOpt.isPresent()) {
                DoctorSlot slot = slotOpt.get();
                if (!slot.getIsActive()) {
                    return false; // Slot bị vô hiệu hóa
                }
                maxPatients = slot.getMaxPatients();
            } else {
                maxPatients = 10; // Mặc định
            }
            
            // Tính số bệnh nhân hiện tại
            Integer currentPatients = getCurrentPatients(doctorId, appointmentDate, timeSlot);
            
            return currentPatients == null || currentPatients < maxPatients;
        } catch (Exception e) {
            System.err.println("Error checking slot availability: " + e.getMessage());
            return false;
        }
    }
    
    private Integer getCurrentPatients(Long doctorId, String appointmentDate, String timeSlot) {
        return patientRegistrationRepository
            .countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, 
                LocalDate.parse(appointmentDate),
                timeSlot,
                "APPROVED"
            );
    }
    
    private Integer getCurrentPatientsForSlot(DoctorSlot slot) {
        return getCurrentPatients(slot.getDoctorId(), slot.getAppointmentDate(), slot.getTimeSlot());
    }
    
    // Phương thức tạo slot tự động cho một bác sĩ trong một ngày
    public void generateSlotsForDoctor(Long doctorId, String appointmentDate, Integer maxPatients) {
        for (String timeSlot : DEFAULT_TIME_SLOTS) {
            // Kiểm tra xem slot đã tồn tại chưa
            boolean exists = doctorSlotRepository.existsByDoctorIdAndAppointmentDateAndTimeSlot(
                doctorId, appointmentDate, timeSlot);
            
            if (!exists) {
                DoctorSlot slot = new DoctorSlot();
                slot.setDoctorId(doctorId);
                slot.setAppointmentDate(appointmentDate);
                slot.setTimeSlot(timeSlot);
                slot.setMaxPatients(maxPatients != null ? maxPatients : 10);
                slot.setIsActive(true);
                
                doctorSlotRepository.save(slot);
            }
        }
    }
    
    // Giữ nguyên các phương thức hiện có cho queue number
    @Transactional
    public Integer getNextQueueNumberWithLock(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("🔒 Getting next queue number WITH LOCK for doctor: " + doctorId + 
                             ", date: " + appointmentDate + ", session: " + timeSlot);
            
            Integer currentCount = patientRegistrationRepository.countApprovedRegistrationsWithLock(
                doctorId, appointmentDate, timeSlot
            );
            
            int nextQueue = (currentCount != null ? currentCount : 0) + 1;
            
            System.out.println("🎯 Current count: " + currentCount + ", Next queue: " + nextQueue);
            
            List<PatientRegistration> existingRegistrations = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, appointmentDate, timeSlot);
            
            if (!existingRegistrations.isEmpty()) {
                System.out.println("📋 Existing registrations in this slot:");
                existingRegistrations.forEach(reg -> {
                    System.out.println("   - ID: " + reg.getId() + ", Queue: " + reg.getQueueNumber() + 
                                     ", Name: " + reg.getFullName());
                });
            }
            
            return nextQueue;
        } catch (Exception e) {
            System.err.println("❌ Error getting next queue number with lock: " + e.getMessage());
            e.printStackTrace();
            return getNextQueueNumber(doctorId, appointmentDate, timeSlot);
        }
    }
    
    public Integer getNextQueueNumber(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        Integer currentCount = patientRegistrationRepository
            .countByDoctorIdAndAppointmentDateAndAssignedSessionAndStatus(
                doctorId, 
                appointmentDate,
                timeSlot,
                "APPROVED"
            );
        return (currentCount != null ? currentCount : 0) + 1;
    }
}