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
    
    // cac khung gio mac dinh
    private static final String[] DEFAULT_TIME_SLOTS = {
        "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
        "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    };
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    // ========== ADMIN CRUD ==========
    
    // lay tat ca slot
    public List<DoctorSlot> getAllSlots() {
        return doctorSlotRepository.findAll();
    }
    
    // lay slot theo bac si
    public List<DoctorSlot> getSlotsByDoctor(Long doctorId) {
        return doctorSlotRepository.findByDoctorId(doctorId);
    }
    
    // lay slot sap toi
    public List<DoctorSlot> getUpcomingSlots() {
        String today = LocalDate.now().format(DATE_FORMATTER);
        return doctorSlotRepository.findByAppointmentDateGreaterThanEqual(today);
    }
    
    // lay slot theo id
    public DoctorSlot getSlotById(Long id) {
        return doctorSlotRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Khong tim thay slot voi ID: " + id));
    }
    
    // tao slot moi
    public DoctorSlot createSlot(DoctorSlot slot) {
        // kiem tra du lieu
        if (slot.getDoctorId() == null) {
            throw new RuntimeException("Can doctor ID");
        }
        if (slot.getAppointmentDate() == null) {
            throw new RuntimeException("Can ngay kham");
        }
        if (slot.getTimeSlot() == null) {
            throw new RuntimeException("Can khung gio");
        }
        
        // kiem tra slot da ton tai chua
        boolean exists = doctorSlotRepository.existsByDoctorIdAndAppointmentDateAndTimeSlot(
            slot.getDoctorId(), slot.getAppointmentDate(), slot.getTimeSlot());
        
        if (exists) {
            throw new RuntimeException("Slot da ton tai cho bac si nay");
        }
        
        // set gia tri mac dinh
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
    
    // cap nhat slot
    public DoctorSlot updateSlot(Long id, DoctorSlot slotDetails) {
        DoctorSlot slot = getSlotById(id);
        
        // cap nhat cac truong co the thay doi
        if (slotDetails.getMaxPatients() != null) {
            slot.setMaxPatients(slotDetails.getMaxPatients());
        }
        if (slotDetails.getIsActive() != null) {
            slot.setIsActive(slotDetails.getIsActive());
        }
        
        slot.setUpdatedAt(LocalDateTime.now());
        
        return doctorSlotRepository.save(slot);
    }
    
    // cap nhat so benh nhan toi da
    public DoctorSlot updateMaxPatients(Long id, Integer maxPatients) {
        if (maxPatients == null || maxPatients < 1) {
            throw new RuntimeException("So benh nhan toi da phai > 0");
        }
        
        DoctorSlot slot = getSlotById(id);
        
        // kiem tra so benh nhan hien tai
        Integer currentPatients = getCurrentPatientsForSlot(slot);
        if (currentPatients > maxPatients) {
            throw new RuntimeException(
                "Khong the dat so benh nhan toi da nho hon so benh nhan hien tai (" + currentPatients + ")");
        }
        
        slot.setMaxPatients(maxPatients);
        slot.setUpdatedAt(LocalDateTime.now());
        
        return doctorSlotRepository.save(slot);
    }
    
    // cap nhat hang loat
    public void bulkUpdateMaxPatients(Integer maxPatients) {
        if (maxPatients == null || maxPatients < 1) {
            throw new RuntimeException("So benh nhan toi da phai > 0");
        }
        
        List<DoctorSlot> allSlots = doctorSlotRepository.findAll();
        
        for (DoctorSlot slot : allSlots) {
            // kiem tra tung slot
            Integer currentPatients = getCurrentPatientsForSlot(slot);
            if (currentPatients <= maxPatients) {
                slot.setMaxPatients(maxPatients);
                slot.setUpdatedAt(LocalDateTime.now());
            }
            // neu currentPatients > maxPatients, bo qua
        }
        
        doctorSlotRepository.saveAll(allSlots);
    }
    
    // xoa slot
    public void deleteSlot(Long id) {
        DoctorSlot slot = getSlotById(id);
        
        // kiem tra slot da co benh nhan chua
        Integer currentPatients = getCurrentPatientsForSlot(slot);
        if (currentPatients > 0) {
            throw new RuntimeException("Khong the xoa slot da co benh nhan dang ky");
        }
        
        doctorSlotRepository.deleteById(id);
    }
    
    // ========== PUBLIC ==========
    
    // lay slot theo bac si va ngay
    public List<DoctorSlotDTO> getSlotsByDoctorAndDate(Long doctorId, String appointmentDate) {
        List<DoctorSlotDTO> result = new ArrayList<>();
        
        // lay slot tu database (neu co)
        List<DoctorSlot> existingSlots = doctorSlotRepository
            .findByDoctorIdAndAppointmentDate(doctorId, appointmentDate);
        
        Map<String, DoctorSlot> slotMap = new HashMap<>();
        for (DoctorSlot slot : existingSlots) {
            if (slot.getIsActive()) {
                slotMap.put(slot.getTimeSlot(), slot);
            }
        }
        
        // tao slot cho tat ca khung gio
        for (String timeSlot : DEFAULT_TIME_SLOTS) {
            DoctorSlotDTO slotDTO = new DoctorSlotDTO();
            slotDTO.setDoctorId(doctorId);
            slotDTO.setAppointmentDate(appointmentDate);
            slotDTO.setTimeSlot(timeSlot);
            
            // lay slot tu database neu co
            DoctorSlot dbSlot = slotMap.get(timeSlot);
            if (dbSlot != null) {
                // slot da duoc cau hinh trong database
                slotDTO.setMaxPatients(dbSlot.getMaxPatients());
            } else {
                // slot mac dinh
                slotDTO.setMaxPatients(10);
            }
            
            // tinh so benh nhan hien tai
            Integer currentPatients = getCurrentPatients(doctorId, appointmentDate, timeSlot);
            slotDTO.setCurrentPatients(currentPatients != null ? currentPatients : 0);
            slotDTO.setAvailable(currentPatients == null || currentPatients < slotDTO.getMaxPatients());
            
            result.add(slotDTO);
        }
        
        return result;
    }
    
    // kiem tra slot con trong khong
    public boolean isSlotAvailable(Long doctorId, String appointmentDate, String timeSlot) {
        try {
            // lay slot tu database
            Optional<DoctorSlot> slotOpt = doctorSlotRepository.findByDoctorIdAndAppointmentDateAndTimeSlot(doctorId, appointmentDate, timeSlot);
            
            int maxPatients;
            if (slotOpt.isPresent()) {
                DoctorSlot slot = slotOpt.get();
                if (!slot.getIsActive()) {
                    return false; // slot bi vo hieu hoa
                }
                maxPatients = slot.getMaxPatients();
            } else {
                maxPatients = 10; // mac dinh
            }
            
            // tinh so benh nhan hien tai
            Integer currentPatients = getCurrentPatients(doctorId, appointmentDate, timeSlot);
            
            return currentPatients == null || currentPatients < maxPatients;
        } catch (Exception e) {
            System.out.println("Loi kiem tra slot: " + e.getMessage());
            return false;
        }
    }
    
    // tinh so benh nhan hien tai
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
    
    // tao slot tu dong cho mot bac si trong mot ngay
    public void generateSlotsForDoctor(Long doctorId, String appointmentDate, Integer maxPatients) {
        for (String timeSlot : DEFAULT_TIME_SLOTS) {
            // kiem tra slot da ton tai chua
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
    
    // lay so thu tu tiep theo voi lock
    @Transactional
    public Integer getNextQueueNumberWithLock(Long doctorId, LocalDate appointmentDate, String timeSlot) {
        try {
            System.out.println("Dang lay so thu tu voi LOCK: bac si " + doctorId + 
                             ", ngay " + appointmentDate + ", gio " + timeSlot);
            
            Integer currentCount = patientRegistrationRepository.countApprovedRegistrationsWithLock(
                doctorId, appointmentDate, timeSlot
            );
            
            int nextQueue = (currentCount != null ? currentCount : 0) + 1;
            
            System.out.println("So luong hien tai: " + currentCount + ", So thu tu tiep theo: " + nextQueue);
            
            List<PatientRegistration> existingRegistrations = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, appointmentDate, timeSlot);
            
            if (!existingRegistrations.isEmpty()) {
                System.out.println("Cac dang ky hien tai:");
                existingRegistrations.forEach(reg -> {
                    System.out.println("ID: " + reg.getId() + ", STT: " + reg.getQueueNumber() + 
                                     ", Ten: " + reg.getFullName());
                });
            }
            
            return nextQueue;
        } catch (Exception e) {
            System.out.println("Loi khi lay so thu tu voi lock: " + e.getMessage());
            return getNextQueueNumber(doctorId, appointmentDate, timeSlot);
        }
    }
    
    // lay so thu tu tiep theo
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